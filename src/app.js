import "./stylesheets/main.css";

// Small helpers you might want to keep
import "./helpers/context_menu.js";
import "./helpers/external_links.js";
import $ from "jquery";

// ----------------------------------------------------------------------------
// Everything below is just to show you how it works. You can delete all of it.
// ----------------------------------------------------------------------------

import { remote } from "electron";
import jetpack from "fs-jetpack";
import env from "env";
import { startLogin } from "./reef/reefaccount";

const app = remote.app;
const appDir = jetpack.cwd(app.getAppPath());

// Holy crap! This is browser window with HTML and stuff, but I can read
// files from disk like it's node.js! Welcome to Electron world :)
const manifest = appDir.read("package.json", "json");

const osMap = {
  win32: "Windows",
  darwin: "macOS",
  linux: "Linux"
};

//document.querySelector("#greet").innerHTML = greet();
//document.querySelector("#os").innerHTML = osMap[process.platform];
//document.querySelector("#author").innerHTML = manifest.author;
//document.querySelector("#env").innerHTML = env.name;
//document.querySelector("#electron-version").innerHTML = process.versions.electron;
$("#dashboard_container").hide();

//TODO: Find jquery equivalent for this.
document.querySelector("#login").addEventListener("click", () => startLogin($("#email").val(), $("#password").val()));

$(document).on("keypress", (key) => {
  if (key.keyCode === 13)
    startLogin($("#email").val(), $("#password").val());
})

export const loginComplete = (reefAccount) => {
  //Switch out our div elements & build the dashboard.
  $("#main_container").hide();
  $("#dashboard_container").show();
  $("#fullname").text(reefAccount.firstName + " " + reefAccount.lastName + " - " + reefAccount.studentId);
  $("#university").text(reefAccount.institutionName);

  reefAccount.courses.forEach(course => {
    $("#course_info_container").append("<div id=course-" + course.courseId + "></div>");

    $("#course-" + course.courseId).append(getCourseNameFormatted(course));
    $("#course-" + course.courseId).append("<p>Meeting Times:</p>");
    course.meetingTimes.forEach(meetingTime => {
      var dateTime = new Date(new Date(meetingTime).toLocaleString("en-US", { timeZone: "America/Winnipeg" }));
      var options = { weekday: 'long', hour: 'numeric', minute: 'numeric' };

      $("#course-" + course.courseId).append("<p>" + dateTime.toLocaleDateString("en-US", options) + "</p>")
    });
  });

  courseSignInCheck(reefAccount);
  setInterval(() => { courseSignInCheck(reefAccount) }, 60000)
}

//!!!!!!!!!!!!!!!!!!!TODO: For quizzes, we send a ajax status packet. The json response returns an activity list that includes quizzes.
//Its the history packet to https://api-gateway.reef-education.com/student/history
/*
Sends:
Accept: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsiY2xvdWQtc2VydmljZS1pbnN0aXR1dGlvbi1pZCIsImNsb3VkLXNlcnZpY2Utbm90aWZpY2F0aW9uLWlkIiwiY291cnNlLXNlcnZpY2UtaWQiLCJzdHVkZW50LXNlcnZpY2UtaWQiLCJhY3Rpdml0eS1zZXJ2aWNlLWlkIiwiY2xvdWQtc2VydmljZS1pbnN0cnVjdG9yLWlkIiwiYXV0aC1wcm94eS1zZXJ2aWNlLWlkIl0sInVzZXJfbmFtZSI6InJ5YW5yaGluQGdtYWlsLmNvbSIsInNjb3BlIjpbInJlYWQiLCJ3cml0ZSJdLCJleHAiOjE1NzA4MDYyMjUsInVzZXJJZCI6IjMwOTk4ZjkyLTYyNzAtNDc1Ny1hNjlmLTAyNjJmYjY5ZjI5YSIsImF1dGhvcml0aWVzIjpbIlJPTEVfUEFSVElDSVBBTlQiXSwianRpIjoiOGM1NzI3ZmQtMThiMC00MThmLTkxZGEtYzVhMTc4Yzk4ZmM1IiwiY2xpZW50X2lkIjoicHJveHktbG9naW4tY2xpZW50LWlkIn0.w5HLxTGQD8hZDsBw4vQWt_4Trg0voCcAQ1CiBWLsFkw
Client-Tag: REEF/STUDENT/5.0.5/WEB///
Content-Type: application/vnd.reef.student-activity-history-request-v1+json
Origin: https://app.reef-education.com
Reef-Auth-Type: oauth
Referer: https://app.reef-education.com/
Sec-Fetch-Mode: cors
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36

Request Payload:
{classSessionId: "205cc3ec-06a9-4ff8-87aa-42f67eff66b8"}

Returns: {"historyItemList":[{"activityId":"aa7c5eea-2499-4440-96cb-39473a826c97","activityType":"ATTENDANCE","startDate":1570724941861,"quizName":null,"pollQuestionId":null}]}

*/
const courseSignInCheck = (reefAccount) => {
  var currentTimeDate = new Date(Date.now());
  reefAccount.courses.forEach(course => {
    course.meetingTimes.forEach(meetingTime => {
      //TODO: For some reason the course time date is 2 hours ahead??? Add time zone?
      var courseTimeDate = new Date(new Date(meetingTime).toLocaleString("en-US", { timeZone: "America/Winnipeg" }));
      //console.log(course.name + ":" + currentTimeDate.getUTCHours() + "," + courseTimeDate.getUTCHours()); //Antrho was 17,15
      //Go through the times & join at the first 10 minutes of class. Better way to do this?
      if (currentTimeDate.getDay() == courseTimeDate.getDay())
        if (getAmPm(currentTimeDate.getHours()) === getAmPm(courseTimeDate.getHours())) {
          if (currentTimeDate.getHours() === (courseTimeDate.getHours())) {//we did +2 here. Is this better than just changing the time zone?
            if (currentTimeDate.getMinutes() - courseTimeDate.getMinutes() > 0 && currentTimeDate.getMinutes() - courseTimeDate.getMinutes() <= 10)
              if (!course.joined)
                course.join(reefAccount);
          }
        } else if (course.joined) //If were still in a class & our am & pm switch. Then assume the class is over. Change later.
          course.joined = false;

      updateDashboard(course);
    });
  });

  $("#title").text("iClicker Auto-Login | Last checked: " + currentTimeDate.toLocaleTimeString());
  $("#course_update_header").text("Last sign-in check: " + currentTimeDate.toLocaleTimeString());
}

//Return formatted <p> element
const getCourseNameFormatted = (course) => {
  var color = course.joined ? "green" : "#7a0202";
  var status = course.joined ? " - Joined Automatically ✅" : " - Not Joined";
  return "<p id=\"name-" + course.courseId + "\" style=\"color:" + color + "\"><b>" + course.name + "</b>" + status + "</p>";
}

const updateDashboard = (course) => {
  $("name-" + course.courseId).text("test");
}

const getAmPm = (hours) => {
  return hours >= 12 ? 'pm' : 'am';
}
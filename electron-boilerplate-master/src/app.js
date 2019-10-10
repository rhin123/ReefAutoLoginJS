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

    $("#course-" + course.courseId).append("<p id=\"name-" + course.courseId + "\">" + getCourseNameFormatted(course) + "</p>")
    $("#course-" + course.courseId).append("<p>Meeting Times:</p>")
    course.meetingTimes.forEach(meetingTime => {
      var dateTime = new Date(meetingTime);
      var options = { weekday: 'long', hour: 'numeric', minute: 'numeric' };

      $("#course-" + course.courseId).append("<p>" + dateTime.toLocaleDateString("en-US", options) + "</p>")
    });
  });

  courseSignInCheck(reefAccount);
  setInterval(() => { courseSignInCheck(reefAccount) }, 60000)
}

const courseSignInCheck = (reefAccount) => {
  var currentTimeDate = new Date(Date.now());
  reefAccount.courses.forEach(course => {
    course.meetingTimes.forEach(meetingTime => {

      var courseTimeDate = new Date(meetingTime);

      //Go through the times & join at the first 10 minutes of class. Better way to do this?
      if (currentTimeDate.getDay() == courseTimeDate.getDay())
        if (getAmPm(currentTimeDate.getHours()) === getAmPm(courseTimeDate.getHours())) {
          if (currentTimeDate.getHours() === courseTimeDate.getHours())
            if (currentTimeDate.getMinutes() - courseTimeDate.getMinutes() > 0 && currentTimeDate.getMinutes() - courseTimeDate.getMinutes() <= 10)
              if (!course.joined)
                course.join(reefAccount);
        } else if (course.joined) //If were still in a class & our am & pm switch. Then assume the class is over. Change later.
          course.joined = false;

      updateDashboard(course);
    });
  });

  $("#title").text("iClicker Auto-Login | Last checked: " + currentTimeDate.toLocaleTimeString());
}

//Return formatted <p> element
const getCourseNameFormatted = (course) => {
  var color = course.joined ? "green" : "blue";
  var status = course.joined ? " - Joined Automatically" : " - Not Joined";
  return "<p style=\"color:" + color + "\"><b>" + course.name + "</b>" + status + "</p>";
}

const updateDashboard = (course) => {
  $("name-" + course.courseId).text(getCourseNameFormatted(course));
}

const getAmPm = (hours) => {
  return hours >= 12 ? 'pm' : 'am';
}
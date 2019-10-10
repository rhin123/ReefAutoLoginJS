import $ from "jquery";
import ReefCourse from "./reefcourse";
import url from "url";
import path from "path";
import { remote } from "electron";
import { loginComplete } from "../app";

export class ReefAccout {

    constructor(email, password) {
        this.email = email;
        this.password = password;
        this.institutionId;
        this.institutionName;
        this.accessToken;
        this.tokenExpireTime;
        this.userId;
        this.jti;
        this.courseCount;
        this.firstName;
        this.lastName;
        this.seckey;
        this.trialStatus;
        this.studentId;
        this.courses = [];
    }


    validateAccount() {
        $.ajax({
            type: "POST",
            beforeSend: (request) => {
                //TOOD: Setup defualt request headers.
                //request.setRequestHeader("Authority", authorizationToken);
                request.setRequestHeader("Client-Tag", "REEF/STUDENT/5.0.5/WEB///");
                request.setRequestHeader("Reef-Auth-Type", "oauth");
                request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                request.setRequestHeader("Accept", "application/json");
            },


            url: "https://api.reef-education.com/trogon/v1/federation/account/association/check",
            data: "{\"email\":\"" + this.email + "\"}",
            processData: false,
            success: (json) => {
                //$("#result").text("The result =" + JSON.stringify(json));
                if (!json.accountExists)
                    $("#result").text("Error: This account doesn't exist.");
                else
                    this.validateUniversity();
            },
            error: () => {
                $("#result").text("Error: This account doesn't exist.");
            }
        });
    }

    validateUniversity() {
        $.ajax({
            type: "POST",
            beforeSend: (request) => {
                //TOOD: Setup defualt request headers.
                //request.setRequestHeader("Authority", authorizationToken);
                request.setRequestHeader("Client-Tag", "REEF/STUDENT/5.0.5/WEB///");
                request.setRequestHeader("Reef-Auth-Type", "oauth");
                request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                request.setRequestHeader("Accept", "application/json");
            },


            url: "https://api.reef-education.com/trogon/v1/federation/account/validate",
            data: "{\"email\":\"" + this.email + "\"}",
            processData: false,
            success: (json) => {
                //TODO: Check for a valid university.
                this.institutionId = json.institutionId;
                this.institutionName = json.institutionName;
                this.loginAccount();
            }
        });
    }

    loginAccount() {
        $.ajax({
            type: "POST",
            beforeSend: (request) => {
                //TOOD: Setup defualt request headers.
                //request.setRequestHeader("Authority", authorizationToken);
                request.setRequestHeader("Client-Tag", "REEF/STUDENT/5.0.5/WEB///");
                request.setRequestHeader("Reef-Auth-Type", "oauth");
                request.setRequestHeader("Content-Type", "application/vnd.reef.login-proxy-request-v1+json");
                request.setRequestHeader("Accept", "application/json");
            },


            url: "https://api-gateway.reef-education.com/authproxy/login",
            data: "{\"email\":\"" + this.email + "\",\"password\":\"" + this.password + "\"}",
            processData: false,
            success: (json) => {
                //console.log(json);
                this.accessToken = json.access_token;
                this.tokenExpireTime = json.expires_in;
                this.userId = json.userId;
                this.jti = json.jti;
                this.getAccountInfo();
            },
            error: (json) => {
                $("#result").text("Error: Incorrect password.");
            }
        });
    }

    getAccountInfo() {
        $.ajax({
            type: "GET",
            beforeSend: (request) => {
                //TOOD: Setup defualt request headers.
                //request.setRequestHeader("Authority", authorizationToken);
                request.setRequestHeader("Client-Tag", "REEF/STUDENT/5.0.5/WEB///");
                request.setRequestHeader("Reef-Auth-Type", "oauth");
                request.setRequestHeader("Content-Type", "application/vnd.reef.login-proxy-request-v1+json");
                request.setRequestHeader("Accept", "application/json");
                request.setRequestHeader("Authorization", "Bearer " + this.accessToken);
                request.setRequestHeader("Cache-Control", "no-cache");
                request.setRequestHeader("Expires", "Mon, 26 Jul 1997 05:00:00 GMT");
                request.setRequestHeader("If-Modified-Since", "Mon, 26 Jul 1997 05:00:00 GMT");
                request.setRequestHeader("Pragma", "no-cache");
            },


            url: "https://api.reef-education.com/trogon/v3/profile",
            processData: false,
            success: (json) => {
                this.courseCount = json.courseCount;
                this.firstName = json.firstName;
                this.lastName = json.lastName;
                this.seckey = json.seckey;
                this.trialStatus = json.status;
                this.studentId = json.studentId;
                this.getCourseInfo();
            }
        });
    }

    getCourseInfo() {
        $.ajax({
            type: "GET",
            beforeSend: (request) => {
                //TOOD: Setup defualt request headers.
                //request.setRequestHeader("Authority", authorizationToken);
                request.setRequestHeader("Client-Tag", "REEF/STUDENT/5.0.5/WEB///");
                request.setRequestHeader("Reef-Auth-Type", "oauth");
                request.setRequestHeader("Content-Type", "application/vnd.reef.login-proxy-request-v1+json");
                request.setRequestHeader("Accept", "application/vnd.reef.student-course-list-response-v1+json");
                request.setRequestHeader("Authorization", "Bearer " + this.accessToken);
                request.setRequestHeader("Cache-Control", "no-cache");
                request.setRequestHeader("Expires", "Mon, 26 Jul 1997 05:00:00 GMT");
                request.setRequestHeader("If-Modified-Since", "Mon, 26 Jul 1997 05:00:00 GMT");
                request.setRequestHeader("Pragma", "no-cache");
            },


            url: "https://api-gateway.reef-education.com/course/student/list",
            processData: false,
            success: (json) => {
                json.courseList.forEach(course => {
                    this.courses.push(new ReefCourse(course.name,
                        course.courseId,
                        course.id,
                        course.instructorName,
                        course.isRemoteOnly,
                        course.meetingTimes));
                });
                loginComplete(this);
            }
        });
    }
}

export const startLogin = (email, password) => {
    //maybe just move it outside?? idk.
    var reefAccount = new ReefAccout("ryanrhin@gmail.com", "Mylaptop123");
    reefAccount.validateAccount();
};
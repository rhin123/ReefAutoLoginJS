import $ from "jquery";
export default class ReefCourse {

    constructor(name, nameId, courseId, instructorName, remoteOnly, meetingTimes) {
        this.name = name;
        this.nameId = nameId;
        this.courseId = courseId;
        this.instructorName = instructorName;
        this.remoteOnly = remoteOnly;
        this.meetingTimes = meetingTimes;
        this.joined = false; //TODO: This might not always be the case.

        //Convert unix time back to seconds.
        //for (var i = 0; i < this.meetingTimes.length; i++)
        //    this.meetingTimes[i] /= 1000;
    }

    join(reefAccount) {
        console.log("Joining Class...");
        $.ajax({
            type: "POST",
            beforeSend: (request) => {
                //TOOD: Setup defualt request headers.
                //request.setRequestHeader("Authority", authorizationToken);
                request.setRequestHeader("Client-Tag", "REEF/STUDENT/5.0.5/WEB///");
                request.setRequestHeader("Reef-Auth-Type", "oauth");
                request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                request.setRequestHeader("Accept", "application/json");
                request.setRequestHeader("Authorization", "Bearer " + reefAccount.accessToken);
            },


            url: "https://api.reef-education.com/trogon/v2/course/attendance/join/" + this.courseId,
            //TODO: 
            data: "{\"geo\":{\"accuracy\":39,\"lat\":29.584474999999998,\"lon\":-98.61909589999999},\"publicIP\":null,\"auto\":false,\"id\":\"" + reefAccount.userId + "\"};",
            processData: false,
            success: (json) => {
                console.log(json);
                this.joined = true;
            },
            error: (json) => {
                alert("Unable to join class ):");
                console.log(json);
            }
        });
    }
}
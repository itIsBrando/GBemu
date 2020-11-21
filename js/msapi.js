const CLIENT_ID = "0ec327fa-36d7-4da7-874a-89868e8ac741";

const API_KEY = 'f26e84ad-5950-47a3-a3b4-a6f7e4cc6528';

const odOptions = {
    clientId: CLIENT_ID,
    action: "query",
    multiSelect: true,
    advanced: {
    },
    success: function(files) { console.log("nice:"); log(files) },
    cancel: function() { console.log("cancelled"); },
    error: function(error) { console.log(error); }
  }

function launchODPicker() {
    OneDrive.open(odOptions);
}
// Find the element by the generic btn class
$(document).ready(() => {
  console.log("Login page")
    $("#show_password").click(function () {
        if (document.getElementById("password").type == "password") {
          document.getElementById("password").type = "text";
          document.getElementById("show_password").classList.remove("fa-eye");
          document.getElementById("show_password").classList.add("fa-eye-slash");
        } else {
          document.getElementById("password").type = "password";
          document.getElementById("show_password").classList.remove("fa-eye-slash");
          document.getElementById("show_password").classList.add("fa-eye");
        }
    });
});

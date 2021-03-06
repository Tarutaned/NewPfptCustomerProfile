// Find the element by the generic btn class
$(document).ready(() => {
    $("#show_password").click(function () {
        if (document.getElementById("password").type == "password") {
          document.getElementById("password").type = "text";
          document.getElementById("show_password").classList.remove("fa-eye");
          document.getElementById("show_password").classList.add("fa-eye-slash");
          document.getElementById("confirm_password").type = "text";
        } else {
          document.getElementById("password").type = "password";
          document.getElementById("show_password").classList.remove("fa-eye-slash");
          document.getElementById("show_password").classList.add("fa-eye");
          document.getElementById("confirm_password").type = "password";
        }
    });

    $('#generate_pw').click(function () {
        document.getElementById("password").value = generate_random_pw();
        document.getElementById("show_password").checked = true;
        toggle_password(true);
    });
});

function generate_random_pw() {
    var password_length = 8;
    var charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ`1234567890-=~!@#$%^&*()_+";
    var generated_pw = "";
    for (var i = 0; i < password_length; i++) {
        generated_pw += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    //console.log(generated_pw);

    //document.getElementById("password").value = generated_pw;
    //document.getElementById("confirm_password").value = generated_pw;

    return generated_pw;
}

function password_equality() {
    var equal = document.getElementById("password").value == document.getElementById("confirm_password").value;
    if(equal) {
        return true;
    } else {
        alert("Passwords are not identical.")
        return false;
    }
}

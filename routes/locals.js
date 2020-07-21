// ==========================================================================================
// Javascript that is made available to the EJS template to use as a local. variable
// ==========================================================================================

// Create a Drop Down box
make_custom_dropdown = function (name, value, list, classname) {
    if (!classname) {
        classname = '';
    }
    var dropdown = '<select class="form-control ' + classname + '" name="' + name + '">';
    dropdown += '<option value="">No response</option>';
    for (var i = 0; i < list.length; i++) {
        if (value == list[i]) {
            dropdown += '<option value="' + list[i] + '" selected>' + list[i] + '</option>';
        } else {
            dropdown += '<option value="' + list[i] + '">' + list[i] + '</option>';
        }
    }
    dropdown += '</select>';
    return dropdown;
};



// ==================================================
// Make Available Externally
// ==================================================
module.exports = make_custom_dropdown
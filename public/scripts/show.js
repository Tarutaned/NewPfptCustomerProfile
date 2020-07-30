var expanded = false;
var sync_forms = true;

var row_count = 1;

// \u2022 is a bullet point

function sync_email_systems_forms() {
    sync_forms = !sync_forms;
    if (sync_forms) {
        document.getElementById("sync-forms").innerHTML = "Unsync Forms";
        alert("The following forms will synchronize similar questions:\n" +
            "\u2022 Email Systems SE/PS" +
            "\n\nPlease review your changes before saving.");
    } else {
        document.getElementById("sync-forms").innerHTML = "Sync Forms";
        alert("The following forms will not synchronize similar questions:\n" +
            "\u2022 Email Systems SE/PS" +
            "\n\nPlease review your changes before saving.");
    }
}

function add_post_listeners(flag, edit, cancel, qform, fieldset, message) {
    $(edit).click(function () {
        let customer_name = $("#unique-customer-name").val();
        if (flag == true && customer_name) {
            // END EDITING
            flag = false;

            let form = $(qform);

            let json = {
                type: "POST",
                timeout: 3000,
                url: form.attr('action'),
                data: form.serialize(),
                success: function (res) {
                    alert(message);
                }
            };
            //console.log(json);

            // POST here.
            $.ajax(json);

            // Locks the form's fieldset
            $(fieldset).prop('disabled', true);
            $(this).first().html('<i class="fa fa-pencil-square-o" aria-hidden="true"> Edit</i>');
            $(this).next().remove();
        } else if (flag == false) {
            // BEGIN EDITING
            flag = true;

            // Unlocks the form's fieldset
            $(fieldset).prop('disabled', false);
            $(this).first().html('<i style="color: deeppink;" class="fa fa-save" aria-hidden="true"> Save</i>');
            $(this).first().after(`<a href="#/" id="${cancel.substring(1)}" aria-hidden="true" data-toggle="modal"><i style="color: deeppink;" class="fa fa-times" aria-hidden="true"> Cancel</i></a>`);
            $(cancel).click(function() {
              if (confirm("Are you sure?")) {
                $(qform)[0].reset();
                $(fieldset).prop('disabled', true);
                editing_customer = false;
                $(edit).first().html('<i class="fa fa-pencil-square-o" aria-hidden="true"> Edit</i>');
                $(edit).next().remove();
              }
            })
        } else {
            alert("Customer name is empty.");
        }
    });
}

// Expands/collapse all sections
function expand_collapse() {
    if (expanded == true) {
        $('.collapse').collapse('hide');
        //$('.collapse').click();
        document.getElementById("collapse-toggle").innerHTML = "Expand All";
        $('i.fa-caret-down').toggleClass('fa-caret-down').toggleClass('fa-caret-right');
        expanded = false;
    } else if (expanded == false) {
        $('.collapse').collapse('show');
        //$('.collapse').click();
        document.getElementById("collapse-toggle").innerHTML = "Collapse All";
        $('i.fa-caret-right').toggleClass('fa-caret-down').toggleClass('fa-caret-right');
        expanded = true;
    }
}

// Changes dropdown arrow directions in anchors
function change_arrow(collapse) {
    // let r = collapse.children(":first");
    // alert(collapse.attr('aria-expanded'));

    if (!$('.collapsing')[0]) { // If not collapsing, OK to click
        collapse.children(":first").toggleClass('fa-caret-down').toggleClass('fa-caret-right');
    }
}

var editing_customer = false;

$(document).ready(() => {
    row_count = $('#contacts_table > tbody > tr').length;

    window.addEventListener("beforeunload", function (e) {
        if (editing_customer || editing_email_systems || editing_sizing
            || editing_desktop_network || editing_import
            || editing_connector_platform || editing_POC || editing_RFE || editing_usage) {
            let confirmationMessage = "You have unsaved changes.";
            e.returnValue = confirmationMessage;     // Gecko, Trident, Chrome 34+
            return confirmationMessage;
        } else {
            return '';
        }
    });

    $("#add_row").click(function (e) {
        let table = $('#contacts_table');
        //console.log(table.find('tbody tr').length);

        table.find('tbody').append('<tr><td>' +
            '<input type="text" class="form-control" placeholder="Contact Name" name="customer[contacts][' + row_count + '][name]" value=""/>' +
            '</td><td>' +
            '<input type="text" class="form-control" placeholder="Contact Title" name="customer[contacts][' + row_count + '][title]" value=""/>' +
            '</td><td>' +
            '<input type="text" class="form-control" placeholder="Contact Email" name="customer[contacts][' + row_count + '][email]" value=""/>' +
            '</td><td>' +
            '<input type="text" class="form-control" placeholder="Contact Phone" name="customer[contacts][' + row_count + '][phone]" value=""/>' +
            '</td><td>' +
            '<input type="text" class="form-control" placeholder="Primary Contact" name="customer[contacts][' + row_count++ + '][primary_contact]" value=""/>' +
            '</td>' +
            '<td><i class="fa fa-trash" aria-hidden="true" onclick="delete_row(this);"></i></td>' +
            '</tr>');
    });

    $("#delete_row").click(function (e) {
        let table = $('#contacts_table');

        if (table.find('tbody tr').length > 1) {
            table.find('tbody tr:last-child').remove();
        }
    });

    // $.ajaxSetup({
    //     async: true
    // });

    let customer_name = $("#unique-customer-name").val();

    //alert(window.location.host);

    // This one is for loading uploaded diagrams
    // $.ajax({
    //     type: "GET",
    //     //timeout: 3000,
    //     url: `http://${window.location.hostname}/customerprofile/uploads/` + encodeURIComponent(customer_name),
    //     success: function (res) {
    //         if (Array.isArray(res)) {
    //             res.forEach(item => {
    //                 //console.log(item);
    //                 switch (item.metadata.diagram) {
    //                     case '1': {
    //                         $('#diagram1').append(`
    //                         <div class="row">
    //                             <a href="../files/${item.filename}">
    //                                 <p class="truncate">${item.metadata.originalname}</p>
    //                             </a>&emsp;&emsp;
    //                             <div style="float: right !important;">
    //                                 <i class="fa fa-trash" aria-hidden="true"
    //                                     onclick="delete_diagram(this, '../files/${item._id}?_method=DELETE');"></i>
    //                             </div>
    //                         </div>`);
    //                         break;
    //                     }
    //                     case '2': {
    //                         $('#diagram2').append(`
    //                         <div class="row">
    //                             <a href="../files/${item.filename}">
    //                                 <p class="truncate">${item.metadata.originalname}</p>
    //                             </a>&emsp;&emsp;
    //                             <div style="float: right !important;">
    //                             <i class="fa fa-trash" aria-hidden="true"
    //                                 onclick="delete_diagram(this, '../files/${item._id}?_method=DELETE');"></i>
    //                             </div>
    //                         </div>`);
    //                         break;
    //                     }
    //                     case '3': {
    //                         $('#diagram3').append(`
    //                         <div class="row">
    //                             <a href="../files/${item.filename}">
    //                                 <p class="truncate">${item.metadata.originalname}</p>
    //                             </a>&emsp;&emsp;
    //                             <div style="float: right !important;">
    //                                 <i class="fa fa-trash" aria-hidden="true"
    //                                     onclick="delete_diagram(this, '../files/${item._id}?_method=DELETE');"></i>
    //                             </div>
    //                         </div>`);
    //                         break;
    //                     }
    //                     default: break;
    //                 }
    //             });
    //         } else {
    //             console.log("GET received no array of items");
    //         }
    //     },
    //     error: function (xhr, status, error) {
    //         console.log(error);
    //     }
    // });

    //var editing_customer = false;
    $('#editCustomerLink').click(function () {
        if (editing_customer == true && customer_name) {
            // END EDITING

            let form = $("#customerForm");
            let new_customer = $('#unique-customer-name').val();
            //alert("New customer: '" + new_customer + "'");

            if (!new_customer) {
                alert("Customer name is empty.");
                return;
            }

            let json = {
                type: "POST",
                timeout: 3000,
                url: form.attr('action'),
                data: form.serialize(),
                success: function (res) {
                    alert('Customer information updated.');

                    $.ajax({
                        type: "POST",
                        timeout: 30000,
                        url: `http://${window.location.hostname}/customerprofile/uploads/` + encodeURIComponent(customer_name),
                        data: { new_name: new_customer },
                        success: function (res) {
                            if (res.success) {
                                alert('Files updated.');
                            } else {
                                alert('No files updated.\nEither a server error has occurred or an improper request was sent.')
                            }
                            location.href = "../index/" + encodeURIComponent(new_customer);
                        },
                        error: function (xhr, status, error) {
                            console.log("Error updating files uploaded.");
                        }
                    });
                },
                error: function (xhr, status, error) {
                    console.log(error);
                    if (error == 'Conflict') {
                        alert("Customer already exists.");
                    } else {
                        alert(error);
                    }
                }
            };
            //console.log(json);

            // POST here.
            $.ajax(json);
            // Locks the form's fieldset
            $("#customerFormFieldset").prop('disabled', true);
            editing_customer = false;
            $(this).first().html('<i class="fa fa-pencil-square-o" aria-hidden="true"> Edit</i>');
            $(this).next().remove();
        } else if (editing_customer == false) {
            // BEGIN EDITING
            $(this).first().html('<i style="color: deeppink;" class="fa fa-save" aria-hidden="true"> Save</i>');
            $(this).first().after('<a href="#/" id="cancelCustomerLink" aria-hidden="true" data-toggle="modal"><i style="color: deeppink;" class="fa fa-times" aria-hidden="true"> Cancel</i></a>');
            $("#cancelCustomerLink").click(function() {
              if (confirm("Are you sure?")) {
                $("#customerForm")[0].reset();
                $("#customerFormFieldset").prop('disabled', true);
                editing_customer = false;
                $("#editCustomerLink").first().html('<i class="fa fa-pencil-square-o" aria-hidden="true"> Edit</i>');
                $("#editCustomerLink").next().remove();
              }
            })

            // Unlocks the form's fieldset
            $("#customerFormFieldset").prop('disabled', false);

            editing_customer = true;
        } else {
            alert("Customer name is empty.");
        }
    });

    let editing_email_systems = false;
    $('#editEmailSystemLink').click(function () {
        let customer_name = $("#unique-customer-name").val();
        if (editing_email_systems == true && customer_name) {
            // END EDITING
            editing_email_systems = false;

            let form = $("#emailSystemForm");

            let json = {
                type: "POST",
                timeout: 3000,
                url: form.attr('action'),
                data: form.serialize(),
                success: function (res) {
                    // if (sync_forms && editing_email_systems_ps) {
                    //     $('#editEmailSystemPSLink').click();
                    // }
                    alert("Email SE Questions saved.")
                }
            };
            //console.log(json);

            // POST here.
            $.ajax(json);

            // Locks the form's fieldset
            $("#emailSystemFormFieldset").prop('disabled', true);
            $(this).first().html('<i class="fa fa-pencil-square-o" aria-hidden="true"> Edit</i>');
            $(this).next().remove();
        } else if (editing_email_systems == false) {
            // BEGIN EDITING
            editing_email_systems = true;

            // Unlocks the form's fieldset
            $("#emailSystemFormFieldset").prop('disabled', false);
            // if (sync_forms && !editing_email_systems_ps) {
            //     $('#editEmailSystemPSLink').click();
            // }
            $(this).first().html('<i style="color: deeppink;" class="fa fa-save" aria-hidden="true"> Save</i>');
            $(this).first().after('<a href="#/" id="cancelEmailSystemLink" aria-hidden="true" data-toggle="modal"><i style="color: deeppink;" class="fa fa-times" aria-hidden="true"> Cancel</i></a>');
            $("#cancelEmailSystemLink").click(function() {
              if (confirm("Are you sure?")) {
                $("#emailSystemForm")[0].reset();
                $("#emailSystemFormFieldset").prop('disabled', true);
                editing_email_systems = false;
                $("#editEmailSystemLink").first().html('<i class="fa fa-pencil-square-o" aria-hidden="true"> Edit</i>');
                $("#editEmailSystemLink").next().remove();
              }
            })
        } else {
            alert("Customer name is empty.");
        }
    });


    let editing_sizing = false;
    let editing_connector_platform = false;
    let editing_desktop_network = false;
    let editing_usage = false;
    let editing_import = false;
    let editing_POC = false;
    let editing_RFE = false;
    let editing_supervision = false;
    add_post_listeners(editing_sizing, '#editSizingLink', '#cancelSizingLink', "#sizingForm", "#sizingFormFieldset", "Sizing Questions saved.");
    add_post_listeners(editing_connector_platform, '#editConnectorPlatformLink', '#cancelConnectorPlatformLink', "#connectorPlatformForm", "#connectorPlatformFormFieldset", "Connect to Platform Questions saved.");
    add_post_listeners(editing_desktop_network, '#editDesktopNetworkLink', '#cancelDesktopNetworkLink', "#desktopNetworkForm", "#desktopNetworkFormFieldset", "Desktop Network Questions saved.");
    add_post_listeners(editing_usage, '#editUsageLink', '#cancelUsageLink', "#usageForm", "#usageFormFieldset", "Usage Questions saved.");
    add_post_listeners(editing_import, '#editImportLink', '#cancelImportLink', "#importForm", "#importFormFieldset", "Import Questions saved.");
    add_post_listeners(editing_POC, '#editPOCLink', '#cancelPOCLink', "#pocForm", "#pocFormFieldset", "POC Questions saved.");
    add_post_listeners(editing_RFE, '#editRFELink', '#cancelRFELink', "#rfeForm", "#rfeFormFieldset", "RFE Questions saved.");
    add_post_listeners(editing_supervision, '#editSupervisionLink', '#cancelSupervisionLink', "#supervisionForm", "#supervisionFormFieldset", "Supervision Questions saved.");

    $("#sidebar-button").click(function() {
      $("#sidebar").toggle();
      $(".page-content").toggleClass("toggled");
    });

    function hideDropdowns() {
      $("#emailsystems-dropdown").hide();
      $("#usage-dropdown").hide();
      $("#supervision-dropdown").hide();
      $("#editSupervisionOverview-dropdown").hide();
    }

    hideDropdowns();

    $("a[href='#general-content']").click(function() {
      hideDropdowns();
    })

    $("a[href='#emailsystems-content']").click(function() {
      hideDropdowns();
      $("#emailsystems-dropdown").toggle();
      $("#editExchangeDetails").collapse("hide");
      $("#editActiveDirectoryDetails").collapse("hide");
      $("#editO365Details").collapse("hide");
    })

    $("a[href='#sizing-content']").click(function() {
      hideDropdowns();
    })

    $("a[href='#connectorplatform-content']").click(function() {
      hideDropdowns();
    })

    $("a[href='#usage-content']").click(function() {
      hideDropdowns();
      $("#usage-dropdown").toggle();
      $("#editUsage-Supervision-dropdown").hide();
      $("#editUsage-Legal").collapse("hide");
      $("#editusage-export").collapse("hide");
    })

    $("a[href='#import-content']").click(function() {
      hideDropdowns();
    })

    $("a[href='#poc-content']").click(function() {
      hideDropdowns();
    })

    $("a[href='#rfe-content']").click(function() {
      hideDropdowns();
    })

    $("a[href='#supervision-content']").click(function() {
      hideDropdowns();
      $("#supervision-dropdown").toggle();
      $("#editSupervisionOverview-dropdown").hide();
      $("#editSupervisionOverview").collapse("hide");
      $("#editSupervision-MessageProfile").collapse("hide");
      $("#editSupervisoryWorkflow").collapse("hide");
      $("#editAdministrativeFunctions").collapse("hide");
      $("#editRuleLexiconMaintenance").collapse("hide");
    })

    $("a[href='#editSupervisionOverview']").click(function() {
      $("#editSupervisionOverview-dropdown").toggle();
      $("a[href='#editSupervisionOverview']").click();
    })

    $("#print-all-content").hide();
    $("#print-general-content").hide();
    $("#print-emailsystems-content").hide();
    $("#print-sizing-content").hide();
    $("#print-connectorplatform-content").hide();
    $("#print-desktopnetwork-content").hide();
    $("#print-usage-content").hide();
    $("#print-import-content").hide();
    $("#print-poc-content").hide();
    $("#print-rfe-content").hide();
    $("#print-supervision-content").hide();

    function print(section) {
      $(section).show();
      var print = $(section).html();
      var temp = $("body").html();
      $("body").html(print);
      $("button, a").remove();
      window.print();
      $("body").html(temp);
      location.reload();
    }

    $("#print-all-button").click(function() {
      print("#print-all-content");
    })

    $("#print-general-button").click(function() {
      print("#print-general-content");
    })

    $("#print-emailsystems-button").click(function() {
      print("#print-emailsystems-content");
    })

    $("#print-sizing-button").click(function() {
      print("#print-sizing-content");
    })

    $("#print-connectorplatform-button").click(function() {
      print("#print-connectorplatform-content");
    })

    $("#print-desktopnetwork-button").click(function() {
      print("#print-desktopnetwork-content");
    })

    $("#print-usage-button").click(function() {
      print("#print-usage-content");
    })

    $("#print-import-button").click(function() {
      print("#print-import-content");
    })

    $("#print-poc-button").click(function() {
      print("#print-poc-content");
    })

    $("#print-rfe-button").click(function() {
      print("#print-rfe-content");
    })

    $("#print-supervision-button").click(function() {
      print("#print-supervision-content");
    })

    $("#collapse-toggle").hide();
});

function delete_row(row) {
    if ($('#contacts_table > tbody > tr').length > 1 && editing_customer) {
        //alert('delete clicked');
        $(row).parent().parent().remove();
    }
}

function delete_diagram(row, url) {
    if (prompt("Delete this file? Type 'yes'.").toLowerCase() == 'yes') {

        let json = {
            type: "POST",
            timeout: 3000,
            url: url,
            success: function (res) {
                $(row).parent().parent().remove();
            },
            error: function (xhr, status, error) {
                alert('Failed to delete file.')
            }
        };

        // POST here.
        $.ajax(json);
    }
}

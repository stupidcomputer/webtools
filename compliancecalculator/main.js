function newStudent(studentname, grade) {
    components = studentname.replace(", ", "|").split("|")
    return {
        "name": studentname,
        "first": components[1],
        "last": components[0],
        "grade": grade,
        "parents": []
    }
}

function newParent(name, phone, email, children) {
    return {
        "name": name,
        "phone": phone,
        "email": email,
        "children": children,
        "realchildren": []
    }
}

function newFamily() {
    return {
        "names": [],
        "parents": [],
        "children": [],
        "records": [],
        "compliance_info": {}
    }
}

const studentbox = document.querySelector('textarea#studenttextarea');
studentbox.addEventListener('paste', (event) => {
    const clipboard_data = (event.clipboardData || window.clipboardData);
    const text_paste_content = clipboard_data.getData('text/plain');
    const html_paste_content = clipboard_data.getData('text/html')
    // This is the raw HTML that can be used to make "rich" content

    var container = document.createElement("html")
    container.innerHTML = html_paste_content
    var table = container.querySelector("table")

    var rawstudentinfo = []

    for (var i = 0, row; row = table.rows[i]; i++) {
        var current = []
        for (var j = 0, col; col = row.cells[j]; j++) {
            currentElem = col; 
            while (currentElem.children.length > 0) {
                currentElem = currentElem.children[0]
            }
            current.push(currentElem.innerHTML);
        }
        rawstudentinfo.push(current);
    }
    // remove the headers from rawstudentinfo
    rawstudentinfo.shift()
    // we have the raw tables, so now convert into student objects
    students = []
    rawstudentinfo.forEach((student) => {
        students.push(newStudent(student[0], student[4]));
    }, false);
    window.students = students;
    console.log("student eval complete");
});

const parentbox = document.querySelector('textarea#parenttextarea');
parentbox.addEventListener('paste', (event) => {
    const clipboard_data = (event.clipboardData || window.clipboardData);
    const text_paste_content = clipboard_data.getData('text/plain');
    const html_paste_content = clipboard_data.getData('text/html')
    // This is the raw HTML that can be used to make "rich" content

    var container = document.createElement("html")
    container.innerHTML = html_paste_content
    var table = container.querySelector("table")

    var rawparentinfo = [];

    for (var i = 0, row; row = table.rows[i]; i++) {
        var current = []
        for (var j = 0, col; col = row.cells[j]; j++) {
            current.push(col.innerText);
        }
        rawparentinfo.push(current);
    }
    // remove the headers from rawparentinfo
    rawparentinfo.shift()
    // serialize to parent objects
    parents = []
    rawparentinfo.forEach((parent) => {
        parents.push(newParent(
            parent[0], parent[1], parent[2], parent[3]
        ))
    })
    window.parents = parents;
    console.log("parent eval complete");
}, false);

const generatefamilyinfo = document.querySelector("button#generatefamilyinfo");
generatefamilyinfo.addEventListener('click', (event) => {
    window.parents.forEach((parent) => {
        window.students.forEach((student) => {
            if(parent.children.includes(student.name)) {
                parent.realchildren.push(student);
            }
        });
    });

    families = [];
    window.parents.forEach((parent) => {
        var foundMatchingFamily = false;
        families.forEach((family) => {
            // this is a hack, but it works
            console.log(JSON.stringify(family.children))
            console.log(JSON.stringify(parent.realchildren))
            console.log(JSON.stringify(family.children) == JSON.stringify(parent.realchildren))
            if (JSON.stringify(family.children) == JSON.stringify(parent.realchildren)) {
                family.parents.push(parent);
                foundMatchingFamily = true;
            }
        })
        if (!foundMatchingFamily) {
            temp = newFamily();
            temp.parents.push(parent);
            temp.children = parent.realchildren;
            families.push(temp);
        }
    });
    
    // generate relevant names for matching later
    families.forEach((family) => {
        // generate parent's names
        family.parents.forEach((parent) => {
            family.names.push(parent.name);
        });

        // generate student's names
        family.children.forEach((student) => {
            family.names.push(`${student.first} ${student.last}`);
        })
    });

    window.familes = families;
    console.log("family eval complete");
}, false);

function findCoorespondingFamily(s) {
    res_family_distance = 1000000;
    res_family = null;
    window.families.forEach((family) => {
        least_family_distance = 10000000;
        family.names.forEach((name) => {
            var distance = levenshtein(s, name);
            if (distance < least_family_distance) {
                least_family_distance = distance;
            }
        })
        console.log(family, least_family_distance);
        if (least_family_distance < res_family_distance) {
            res_family_distance = least_family_distance;
            res_family = family;
        }
    })

    return res_family;
}

const signupgeniussubmission = document.getElementById("signupgenius");
signupgeniussubmission.addEventListener('change', (e) => {
    var file = e.target.files[0];
    if(!file) return;

    var reader = new FileReader();
    reader.onload = function(e) {
        var contents = e.target.result;
        contents = $.csv.toArrays(contents);
        window.sign_up_genius_records = contents;

        // attach records to families
        window.sign_up_genius_records.forEach((record) => {
            console.log(record);
            if (record[4] === "" && record[5] === "") return;
            try {
                var name = record[4].concat(record[5]);
            } catch (TypeError) {
                console.log("Found record that doesn't parse");
                return;
            }
            var prob_family = findCoorespondingFamily(name);
            prob_family.records.push(record);

            // calculate compliance information
            var signups_required = prob_family.children.length * 2;
            var is_in_compliance = prob_family.records.length >= signups_required;
            prob_family.compliance_info["strict"] = is_in_compliance;
        });
    }
    reader.readAsText(file);

})

const generatestatistics = document.getElementById("families_genstats");
generatestatistics.addEventListener("click", (e) => {
    var number_families = 0;
    var number_in_compliance = 0;
    window.families.forEach((family) => {
        number_families += 1;
        var signups_required = family.children.length * 2;
        var is_in_compliance = family.records.length >= signups_required;
        if(is_in_compliance) {
            number_in_compliance += 1;
        }
    })

    const html_number_families = document.getElementById("families_total");
    const html_number_in_compliance = document.getElementById("families_incompliance");
    html_number_families.innerHTML = number_families;
    html_number_in_compliance.innerHTML = number_in_compliance;
})

const downloadcsv = document.getElementById("downloadcsv");
downloadcsv.addEventListener("click", (e) => {
    var table = [];
    table.push(["Parents", "Children", "Number of Children", "Routes Signed Up For", "Parent Emails", "Parent Phone Numbers"])
    window.families.forEach((family) => {
        var new_record = [];

        // generate parents column
        var parent_names = [];
        family.parents.forEach((parent) => {
            parent_names.push(parent.name);
        })
        parent_names.join("; ");
        new_record.push(parent_names);

        // generate children column
        var child_names = [];
        family.children.forEach((child) => {
            child_names.push(child.name);
        })
        child_names.join("; ");
        new_record.push(child_names);

        // generate num children column
        var num_children = family.children.length;
        new_record.push(num_children);

        // generate num routes column
        var num_routes = family.records.length;
        new_record.push(num_routes);

        // generate parent emails column
        var parent_emails = [];
        family.parents.forEach((parent) => {
            parent_emails.push(parent.email);
        })

        parent_emails.join("; ");
        new_record.push(parent_emails);

        // generate parent phone numbers column
        var parent_phone_numbers = [];
        family.parents.forEach((parent) => {
            parent_phone_numbers.push(parent.phone);
        })

        parent_phone_numbers.join("; ");
        new_record.push(parent_phone_numbers);

        table.push(new_record)
    });

    var csv_out = $.csv.fromArrays(table);
    var blob = new Blob([csv_out], {type: "text/csv"});
    saveAs(blob, "report.csv");
})
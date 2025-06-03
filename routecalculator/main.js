function processRawDataSlot(row) {
    return {
        "id": row[0],
        "salesandcreditsforeignkey": row[1],
        "firstname": row[2],
        "lastname": row[3],
        "housenumber": row[4],
        "street": row[5],
        "city": row[6],
        "state": row[7],
        "zipcode": row[8],
        "neighborhood": row[9],
        "fullname": row[10],
        "mailingaddr": row[11],
        "fulladdr": row[12],
        "emailaddr": row[13],
        "phone": row[14],
        "type": row[15],
        "expiration": row[16],
        "status": row[17],
        "numflags": row[18],
        "group": row[19],
        "customerid": row[20],
        "comments": row[21],
        "lastuser": row[22],
        "dateupdated": row[23],
        "datecreated": row[24],
        "is_placed": "",
        "is_picked_up": "",
        "calculated_trackvia_url": ""
    }
}

function processRawDataSlots(slots) {
    let output = [];
    slots.forEach((v) => {
        output.push(processRawDataSlot(v));
    });

    output.shift(); /* first element is just a header */
    return output;
}

function processCSV(csvdata) {
    return processRawDataSlots(
        $.csv.toArrays(csvdata)
    );
}

function removeInactive(data) {
    let output = [];
    data.forEach((v) => {
        if(v["status"] === "Active") output.push(v);
    })
    return output;
}

function groupByField(entries, field) {
    var output = {};
    entries.forEach(entry => {
        if(!(entry[field] in output)) {
            output[entry[field]] = new Array();
        }

        output[entry[field]].push(entry);
    })

    return output;
}
function groupByRoute(entries) { return groupByField(entries, "group"); }

function sortByAddress(entries) {
    return entries.sort((a, b) => {
        var nameA = a["street"].toUpperCase();
        var nameB = b["street"].toUpperCase();

        if(nameA < nameB) return -1;
        else if(nameA > nameB) return 1;

        nameA = a["housenumber"].toUpperCase();
        nameB = b["housenumber"].toUpperCase();

        if(nameA < nameB) return -1;
        else if(nameA > nameB) return 1;
        return 0;
    })
}

function sortRoutesByAddress(routes) {
    for(key in routes) {
        routes[key] = sortByAddress(routes[key]);
    }

    return routes;
}

function insertArrayIntoTable(table, array) {
    var row = table.insertRow();
    array.forEach((e) => {
        var cell = row.insertCell();
        var textnode = document.createTextNode(e);
        cell.appendChild(textnode);
    });
}

function stripTrailingDecimal(cell) {
    return cell.replace('.0', '');
}

function sumFlagsOnRoute(route) {
    var sum = 0;
    route.forEach((entry) => {
        sum += parseInt(entry["numflags"]);
    });
    return sum;
}

function c(e) {
    return document.createElement(e);
}

function g(i) {
    return document.getElementById(i);
}

function rowonclickHandler(routes, e) {
    /* interface elements */
    const recordview = g("recordview");
    const mainpage = g("mainpage");

    const addressview = g("addressview");
    const neighborhoodname = g("neighborhoodname");
    const mailingaddrname = g("mailingaddrname");
    const emailaddrname = g("emailaddrname");
    const phone = g("phonename");
    const numberofflags = g("numberofflags");
    const peoplename = g("peoplename");
    const routename = g("routename");
    const trackvia = g("viewintrackvia");
    const googlemaps = g("viewongooglemaps");

    const parent = e.target.parentNode;
    const id = parent.children[0].innerHTML;
    const group = parent.children[1].innerHTML;

    /* render the record into the form */
    record = routes[group].find(obj => obj["id"] == id);
    addressview.innerHTML = record["fulladdr"];
    peoplename.innerHTML = record["fullname"];
    neighborhoodname.innerHTML = record["neighborhood"];
    mailingaddrname.innerHTML = record["mailingaddr"];
    emailaddrname.innerHTML = record["emailaddr"];
    emailaddrname.href = "mailto:".concat(record["emailaddr"]);
    phone.innerHTML = record["phone"];
    phone.href = "tel:".concat(record["phone"]);
    numberofflags.innerHTML = stripTrailingDecimal(record["numflags"]);
    routename.innerHTML = record["group"];
    routename.href = `#${record["group"].replace(' ', '_')}`;
    trackvia.href = `https://go.trackvia.com/#/apps/4/tables/23/views/28/records/view/${record["id"]}/form/51`;
    googlemaps.href = "http://maps.google.com/maps?q='" + 
        encodeURIComponent(`${record["fulladdr"]} ${record["city"]} ${record["state"]} ${record["zipcode"]}`);

    /* switch from the main view to the record view */
    mainpage.style.display = "none";
    recordview.style.display = "block";
}

function renderEntriesToId(routes) {
    /* boilerplate */
    const listedAttributes = ["id", "group", "firstname", "lastname", "housenumber", "street", "numflags", "is_placed", "is_picked_up", "comments"];
    const tableHeaders = ["ID", "Route", "First", "Last", "Number", "Street", "#", "P", "R", "Comments"];
    var container = g("output");
    var routeassignments = g("routeassignments");
    var directionsEntry = g("directionInputContainer");
    directionsEntry.style.display = "block";
    container.innerHTML = '';
    routeassignments.innerHTML = '';

    var assignmentstable = c("table");
    var assignmentsheader = c("thead");
    var assignmentsbody = c("tbody");
    const assignmentsTableHeaders = ["Route Name", "Assigned Person"];
    assignmentstable.id = "assignmentstable";
    routeassignments.appendChild(assignmentstable);
    assignmentstable.appendChild(assignmentsheader);
    assignmentstable.appendChild(assignmentsbody);
    insertArrayIntoTable(assignmentsheader, assignmentsTableHeaders);

    Object.keys(routes).sort().forEach((route) => {
        /* setup the boilerplate for this route */
        var page = c("div");
        page.className = "page";
        var header = c("h1");
        header.innerHTML = routes[route][0]["group"];
        header.id = route.replace(' ', '_');
        var routedescription = c("p");
        routedescription.innerHTML = `${routes[route].length} records with ${sumFlagsOnRoute(routes[route])} flags`
        var personassigned = c("span");
        personassigned.innerHTML = ".";
        routedescription.appendChild(personassigned);
        personassigned.id = Math.floor(Math.random() * 100000);
        var directions = c("p");
        directions.className = "directions";
        var assignmentrow = assignmentsbody.insertRow();
        var routename = assignmentrow.insertCell();
        routename_node = c("a");
        routename_node.innerHTML = route;
        routename_node.href = `#${header.id}`
        routename.appendChild(routename_node);
        var routeassignment_cell = assignmentrow.insertCell()
        var routeassignment_field = document.createElement("input");
        routeassignment_field.type = "text";
        routeassignment_field.className = "routeassignmentfield";
        routeassignment_field.oninput = function(e) {
            var documentNode = document.getElementById(personassigned.id);
            if(e.target.value === "") {
                documentNode.innerHTML = ".";
            } else {
                documentNode.innerHTML = `, assigned to ${e.target.value}.`;
            }
        }
        routeassignment_cell.appendChild(routeassignment_field);

        page.appendChild(header);
        page.appendChild(routedescription);
        page.appendChild(directions);
        var table = c("table");
        table.className = "routetable"
        var tableheader = c("thead");
        var tablebody = c("tbody");
        table.appendChild(tableheader);
        table.appendChild(tablebody);

        insertArrayIntoTable(tableheader, tableHeaders);

        routes[route].forEach((entry) => {
            var row = tablebody.insertRow();
            row.className = "routeRow";
            listedAttributes.forEach((attr) => {
                var cell = row.insertCell();
                cell.className = attr;
                var content = entry[attr];

                switch(attr) {
                    case "numflags":
                        if(parseInt(entry[attr]) > 1) cell.classList.add("attention");
                        /* fallthrough */
                    case "housenumber":
                        content = stripTrailingDecimal(content);
                        break;
                }
                var textnode = document.createTextNode(content);
                cell.appendChild(textnode);
            });
        });

        page.appendChild(table);
        container.appendChild(page);
    });

    Array.from(document.getElementsByClassName("routeRow")).forEach((row) => {
        row.addEventListener("click", (e) => { rowonclickHandler(routes, e); }, false);
    })
}

function onFileInput(e) {
    var file = e.target.files[0];
    if(!file) return;

    var reader = new FileReader();
    reader.onload = function(e) {
        var contents = e.target.result;
        contents = processCSV(contents); /* convert to nice dictionary representation */
        contents = removeInactive(contents); /* remove inactive entries */
        contents = groupByRoute(contents) /* group by route name */
        contents = sortRoutesByAddress(contents); /* sort routes by address */

        console.log(contents);
        renderEntriesToId(contents, "output");
    }
    reader.readAsText(file);
}

document.getElementById("fileinput").addEventListener('change', onFileInput, false);
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.key === '[') {
    var controls = document.getElementById("maincontrols");
    var style = controls.style.display;
    if(style === "block" || style === "") controls.style.display = "none";
    else controls.style.display = "block";
  }
});
document.getElementById("directionInput").addEventListener('input', (e) => {
    const parsed = marked.parse(e.target.value);
    Array.from(document.getElementsByClassName("directions")).forEach((directionBox) => {
        directionBox.innerHTML = parsed;
    });
}, false);

document.getElementById("directionInput").value = 
`**DIRECTIONS**:
Hey there! Thanks for volunteering for the flag program.
Here's some important things you ought to know.`;

document.getElementById("backtomainview").addEventListener("click", (e) => {
    document.getElementById("recordview").style.display = "none";
    document.getElementById("mainpage").style.display = "block";
})
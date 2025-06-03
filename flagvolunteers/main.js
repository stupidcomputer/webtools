
/* split, then serialize the data in the signupgenius csv */
function processSUGCSV(contents) {
    /* this doesn't have to be a full csv parser, just enough
     * to parse the csvs that signupgenius generates */
    var output = [];
    contents.split("\n").forEach(line => {
        const splitted = line.slice(0, -1).split("\",\"");

        splitted[0] = splitted[0].slice(1);
        splitted[splitted.length - 1] = splitted[splitted.length - 1].slice(0, -2);
        output.push(splitted);
    });
    /* sometimes, there's one or two entries at the end which are
     * not actual data, so we can remove them */
    for(let i = 0; i < output.length; i++) {
        if(output[i].length <= 1) {
            output.pop(i);
            i--;
        }
    }
    output = output.slice(1);
    console.log(output);

    var fancyoutput = [];
    /* TODO: there's probably an easier way to serialize this */
    output.forEach(entry => {
        fancyoutput.push({
            "date": entry[0],
            "quantity": entry[1],
            "taskname": entry[2], /* aka a route */
            "taskdesc": entry[3],
            "first": entry[4],
            "last": entry[5],
            "email": entry[6],
            "comment": entry[7],
            "timestamp": entry[8],
            "address1": entry[9],
            "address2": entry[10],
            "city": entry[11],
            "state": entry[12],
            "zipcode": entry[13],
            "country": entry[14],
            "phone": entry[15],
            "phonetype": entry[16],
            "vehicle": entry[17]
        });
    });

    return fancyoutput;
}

/* for an array a, generate a dictionary such that for a field
 * f in an element of array a, all like fields are grouped under
 * one dictionary entry */
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
function groupByRoute(entries) { return groupByField(entries, "taskname"); }
function groupByDate(entries) { return groupByField(entries, "date"); }

/* is a volunteer slot filled? */
function slotUnfilled(slot) { return slot["first"] == ""; }

function processContents(contents) {
    var csvdata = processSUGCSV(contents);
    /* group the csvdata into dates */
    var dates = groupByDate(csvdata);
    /* for each date, then group the data by route */
    for(var key in dates) {
        dates[key] = groupByRoute(dates[key]);
    }

    return dates;
}

function handleNameClick(e) {
    var name = this.innerHTML;

    navigator.clipboard.writeText(name).then(function() {
        console.log('copied to clipboard');
    }, function(err) { 
        console.error('couldn\'t copy: ', err);
    });
}

function dateSelector(e) {
    var data = window.routedata[this.innerHTML];
    var container = document.getElementById("vizcontainer");
    container.innerHTML = "";
    for(route in data) {
        var routedata = data[route];
        var routecontainer = document.createElement("div");
        routecontainer.className = "datecolumn";

        var title = document.createElement("p");
        title.innerHTML = `<b>${route}</b>`;
        routecontainer.appendChild(title);

        for(let i = 0; i < routedata.length; i++) {
            var current = routedata[i];
            console.log(current);
            var newitem = document.createElement("div");
            if(!window.showNames) {
                if(slotUnfilled(current)) {
                    newitem.className = "box box-unfilled";
                    console.log("unfilled");
                } else {
                    newitem.className = "box box-filled";
                    console.log("filled");
                }
            } else {
                newitem.innerHTML = current["first"] + " " + current["last"];
                newitem.addEventListener('click', handleNameClick, false);
                newitem.className = "boxedname";
            }
            routecontainer.appendChild(newitem);
        }

        container.appendChild(routecontainer);
    }
}

function generateDateChoices(data) {
    var dates = document.getElementById("dates");
    dates.innerHTML = ""; /* clear all children */
    for(var date in data) { 
        var elem = document.createElement("a");
        elem.href = "#";
        elem.addEventListener("click", dateSelector, false);
        elem.innerHTML = date;

        dates.appendChild(elem);
    }
    document.getElementById("nodates").style.display = "none";
    document.getElementById("toggleshow").style.display = "block";
}

function readFile(e) {
    var file = e.target.files[0];
    if(!file) return;

    var reader = new FileReader();
    reader.onload = function(e) {
        var contents = e.target.result;
        window.routedata = processContents(contents);
        generateDateChoices(window.routedata);
        window.showNames = false;
    }
    reader.readAsText(file);
}

document.getElementById("fileinput").addEventListener('change', readFile, false);
document.getElementById("toggleshow").addEventListener('click', (e) => {
    if(window.showNames) {
        window.showNames = false;
        e.target.innerHTML = "Generating icons";
    } else {
        window.showNames = true;
        e.target.innerHTML = "Generating names";
    }
});
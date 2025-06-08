/* utilities */
function countItemTypes(items, itemtype) {
    let count = 0;

    for(item of items) {
        if(item.type === itemtype) count++;
    }

    return count;
}

function groupByDate(items) {
    var output = {};

    for(item of items) {
        if(item.date in output) {
            output[item.date].push(item);
        } else {
            output[item.date] = [item];
        }
    }

    return output;
}

function returnIfType(items, itemtype, attribute) {
    var output = [];
    for(item of items) {
        if(item.type === itemtype) {
            output.push(item.payload[attribute]);
        }
    }

    console.log(output);

    return output;
}

function renderDayOutput(day) {
    console.log(day);
    const weightheightitems = countItemTypes(day, "weightheightlog");
    const fitnessitems = countItemTypes(day, "fitnesslog");
    const fooditems = countItemTypes(day, "foodlog");

    var foodSummation = returnIfType(day, "foodlog", "cals")
                        .reduce((partialSum, a) => partialSum + a, 0);
    var fitnessSummation =
                        returnIfType(day, "fitnesslog", "cals")
                            .reduce((partialSum, a) => {
                                if(a === "?") return partialSum;
                                return partialSum + a;
                            }, 0)
    var deficit = foodSummation - fitnessSummation;

    return `
    <div class="dayslot">
        <span class="datename">${day[0]["date"]}</span>
        <div class="daystats">
            <span class="counter weightheightcounter">${weightheightitems} weight/height entries</span>
            <span class="counter fitnesscounter">${fitnessitems} fitness event entries</span>
            <span class="counter fooditems">${fooditems} food entries</span>
        </div>
        <span class="summation">${foodSummation} kCal consumed, ${fitnessSummation} kCal expended, ${deficit} diff</span>
    </div>`
}


function readFile(e) {
    var file = e.target.files[0];
    if(!file) return;

    var reader = new FileReader();
    reader.onload = function(e) {
        var contents = e.target.result;
        contents = JSON.parse(contents);
        contents = groupByDate(contents);

        const outputcontainer = document.getElementById("output");
        var innerHTML = '';
        for(k of Object.keys(contents).sort()) {
            innerHTML += renderDayOutput(contents[k]);
        }
        outputcontainer.innerHTML = innerHTML;
        console.log(contents);
    }
    reader.readAsText(file);
}
document.getElementById("fileinput").addEventListener('change', readFile, false);
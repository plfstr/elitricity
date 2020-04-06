
function buildList(source) {
  return `
      <li class="cover">
        <h2>${source.fuel}</h2>
        <p class="num">${source.perc}<small>%</small></p>
      </li>
    `;
}

function buildOutput(generation) {
  
  let output = document.querySelector('#output');
  
  if(!output) return;
  
  let domList = document.createElement('ul');
  let griddata = generation.data;
  let gridsources = gridata.generationmix;
  for (source of gridsources) {
    domList.innerHTML += buildList(source);
  };
  
  let domDatainfo = document.createElement('p');
  domDatainfo.className = 'lowlight';
  domDatainfo.textContent = `Updated ${new Date(griddata.to).toLocaleString("en-GB")}`;
  
  output.querySelector('.loader').setAttribute('hidden','');
  domList.dataset.timeto = griddata.to;
  output.append(domList, domDatainfo);
}

let init = async () => {
  const response = await fetch(
    "https://api.carbonintensity.org.uk/generation", {cache: 'no-store'}
  ).catch(error => {
    output.textContent = `Sorry, error fetching grid data [${error}]`;
  });
  const data = await response.json();
  buildOutput(data);
};

init();

if ("serviceWorker" in navigator) {
  if (navigator.serviceWorker.controller) {
    console.log("Service Worker Registered");
  } else {
    navigator.serviceWorker
      .register("sw.js", {
        scope: "./"
      })
      .then(function (reg) {
        console.log('Service Worker Registered!');
      })
      .catch(function(error) {
        console.log('Registration failed with ' + error);
      });
  }
}
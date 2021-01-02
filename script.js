import DOMPurify from './purify.es.js';
import lifecycle from './lifecycle.mjs';

let output = document.querySelector('#output');
let loader = document.querySelector('.loader');

function buildOutput(generation) {
  
  if(!output) return;

  let domList = document.createElement('ul');
  let griddata = generation.data;
  let gridsources = griddata.generationmix;

  for (let eachsource of gridsources) {
    domList.innerHTML += DOMPurify.sanitize(`<li class="cover">${eachsource.fuel} <span class="num">${eachsource.perc}%</span></li>`);
  };
  
  let domDatainfo = document.createElement('p');
  domDatainfo.className = 'lowlight';
  domDatainfo.textContent = `Updated ${new Date(griddata.to).toLocaleString("en-GB")}`;
  
  resetdata();
  domList.dataset.timeto = DOMPurify.sanitize(griddata.to);
  output.append(domList, domDatainfo);
}

function resetdata() {
  output.innerHTML = "";
  loader.toggleAttribute('hidden');
  if (navigator.clearAppBadge) {
    navigator.clearAppBadge().catch((error) => {
      console.error(error);
    });
  }
}

function renderdata() {
  if (!fetchexpired()) return;
  if (!confirm('Newest data available! Refresh data?')) return;
  resetdata();
  fetchdata();
}

let fetchdata = async () => {
  let response = await fetch(
    "https://api.carbonintensity.org.uk/generation", {cache: 'no-store'}
  ).catch(error => {
    resetdata();
    output.textContent = `Sorry, error fetching grid data [${error}]`;
  });
  let data = await response.json();
  buildOutput(data);
};

function fetchexpired() {
  let timevalid = 1000*60*32;
  let timeto = document.querySelector('ul').dataset.timeto;
  let timeuntil = new Date(timeto).getTime() + timevalid;
  let timenow = new Date().getTime();
  if (navigator.setAppBadge) {
    if (timenow > timeuntil) {
      navigator.setAppBadge().catch((error) => {
        console.error(error);
      });
    }
  }
  return timenow > timeuntil;
}

if (lifecycle) {
  lifecycle.addEventListener('statechange', (event) => {
    if (event.oldState === 'hidden' && event.newState === 'passive') {
          renderdata();
      }
  });
}

fetchdata();

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

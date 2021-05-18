import DOMPurify from './purify.es.js';
import lifecycle from './lifecycle.mjs';

let output = document.querySelector('#output');
let loader = document.querySelector('.loader');

function buildOutput(generation) {
  
  if(!output) return;

  try {
    let {
      data:{
        to,
        generationmix
      }
    } = generation;
    let domList = document.createElement('ul');
    for (let {fuel, perc} of generationmix) {
      domList.innerHTML += DOMPurify.sanitize(`<li class="cover">${fuel} <span class="num">${perc}%</span></li>`);
    };
    
    let domDataoptions = {month:"2-digit",year:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"};
    let domDatainfo = document.createElement('p');
    domDatainfo.className = 'lowlight';
    domDatainfo.textContent = `Updated ${new Intl.DateTimeFormat('en-GB',domDataoptions).format(new Date(to))}`;
    
    resetdata();
    domList.dataset.timeto = DOMPurify.sanitize(to);
    output.append(domList, domDatainfo);
  } 
  catch(error) {
    resetdata();
    output.textContent = `Sorry, error generating grid data (${error.name})`;
  }
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
  createrefresh();
}

let fetchdata = async () => {
  let response = await fetch(
    'https://api.carbonintensity.org.uk/generatiodn', {cache: 'reload'}
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

function createrefresh() {
  let details = document.querySelector('p.lowlight');
  if (details.classList.contains('has-refresh')) return;
    details.textContent += " - New data available!"
    details.classList.add('has-refresh');
  let domRefresh = document.createElement('button');
    domRefresh.value = "Refresh";
    domRefresh.textContent = "Refresh Data";
    domRefresh.class = "invert";
    details.appendChild(domRefresh);
  if (document.querySelector('button')) {
    domRefresh.addEventListener('click', refreshdata, {once: true});
  }
}

function removerefresh() {
  document.querySelector('button').remove();
  document.querySelector('p.lowlight').classList.remove('has-refresh');
}

function refreshdata() {
  removerefresh();
  resetdata();
  fetchdata();
}

if (lifecycle) {
  lifecycle.addEventListener('statechange', (event) => {
    if (event.oldState === 'frozen' && event.newState === 'passive' || event.oldState === 'hidden' && event.newState === 'passive') {
          renderdata();
      }
  });
}

document.addEventListener('DOMContentLoaded', fetchdata, false);

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

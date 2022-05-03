import DOMPurify from './purify.es.js';
import lifecycle from './lifecycle.mjs';

let output = document.querySelector('#output');
let loader = document.querySelector('.loader');
var timeto = null;
const oldstates = ['frozen', 'hidden'];
const newstates = ['passive', 'active'];

function buildOutput(generation) {
  
  if(!output) return;

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
    
    let domDatainfo = document.createElement('p');
    domDatainfo.className = 'lowlight';
    domDatainfo.textContent = `Updated ${makedate(to)}`;
    
    resetdata();
    output.append(domList, domDatainfo);
    
}
  
function makedate(date) {
  let options = {month:"2-digit",year:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"};
  return new Intl.DateTimeFormat('en-GB', options).format(new Date(date));
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
  if (!navigator.onLine) return;
  if (!fetchexpired()) return;
  if (fetchexpired()) {
      createrefresh();
      if (navigator.setAppBadge) {
      navigator.setAppBadge().catch((error) => {
        console.error(error);
      });
    }
  }
}

let fetchdata = async () => {
  let response = await fetch(
    'https://api.carbonintensity.org.uk/generation', {cache: 'reload'}
  ).catch(error => {
    resetdata();
    output.textContent = `Sorry, error fetching grid data [${error}]`;
  });
  let data = await response.json();
  try {
    buildOutput(data);
    timeto = data.data.to;
  } 
  catch(error) {
    resetdata();
    output.textContent = `Sorry, error generating grid data (${error.name})`;
  }
};

function fetchexpired() {
  let timevalid = 1000*60*32;
  let timeuntil = new Date(timeto).getTime() + timevalid;
  let timenow = new Date().getTime();
  return timenow > timeuntil;
}

function createrefresh() {
  if (details.classList.contains('has-refresh')) return;
  let details = document.querySelector('#output p');
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
  document.querySelector('#output p').classList.remove('has-refresh');
}

function refreshdata() {
  removerefresh();
  resetdata();
  fetchdata();
}

if (lifecycle) {
  lifecycle.addEventListener('statechange', (event) => {
    if (oldstates.includes(event.oldState) && newstates.includes(event.newState)) {
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

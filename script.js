import lifecycle from './lifecycle.mjs';

let output = document.querySelector('#output');
let loader = document.querySelector('.loader');

const htmlEscapes = string => string
.replace(/&/g, '&amp;')
.replace(/"/g, '&quot;')
.replace(/'/g, '&#39;')
.replace(/</g, '&lt;')
.replace(/>/g, '&gt;');

const htmlEscape = (strings, ...values) => {
	if (typeof strings === 'string') {
		return htmlEscapes(strings);
	}

	let output = strings[0];
	for (const [index, value] of values.entries()) {
		output = output + htmlEscapes(String(value)) + strings[index + 1];
	}

	return output;
};

function buildList(source) {
  return `
      <li class="cover">
        <h2>${htmlEscape(source.fuel)}</h2>
        <p class="num">${typeof source.perc === 'number' && isFinite(source.perc) ? source.perc : '-'}<small>%</small></p>
      </li>
    `;
}

function buildOutput(generation) {
  
  if(!output) return;

  let domList = document.createElement('ul');
  let griddata = generation.data;
  let gridsources = griddata.generationmix;
  for (let eachsource of gridsources) {
    domList.innerHTML += buildList(eachsource);
  };
  
  let domDatainfo = document.createElement('p');
  domDatainfo.className = 'lowlight';
  domDatainfo.textContent = `Updated ${new Date(griddata.to).toLocaleString("en-GB")}`;
  
  loader.setAttribute('hidden','');
  output.innerHTML = "";
  domList.dataset.timeto = htmlEscape(griddata.to);
  output.append(domList, domDatainfo);
}

function resetdata() {
  output.innerHTML = "";
  loader.removeAttribute('hidden');
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

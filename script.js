import { html, render } from "https://unpkg.com/lit-html?module";

let output = document.querySelector("#output");
let timeexpired = false;

let templ = generation => html`
	<ul data-timeto=${generation.data.to}>
	${generation.data.generationmix.map(
    source => html`
		<li class="cover ${source.fuel}">
				<h2>${source.fuel}</h2>
				<p class="num">${source.perc}<small>%</small></p>
		</li>
	`
  )}
	</ul>
  <p class="lowlight"><small>(Updated <time datetime="${generation.data.from}">${new Date(generation.data.from).toLocaleString("en-GB")}</time>)</small><button type="button" aria-controls="#output" @click=${fetchdata} ?hidden=${!timeexpired}>Refresh Data?</button></p>
`;

let fetchdata = async () => {
  const response = await fetch(
    "https://api.carbonintensity.org.uk/generation"
  ).catch(error => {
    document.querySelector(
      "#output"
    ).textContent = `Sorry, error fetching grid data [${error}]`;
  });
  const data = await response.json();
  render(templ(data), output);
};

// Compare `generation.data.to` + 60 mins, to `new Date`...
let fetchexpired = () => {
  let timevalid = 1000*60*60;
  let timeuntil = Date.parse(document.querySelector('ul').dataset.timeto) + timevalid;
  let timenow = Date.parse(new Date());
  return timeuntil > timenow; 
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
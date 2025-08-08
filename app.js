import { LitElement, html, render, css } from './vendor/lit-core.min.js';
import {GridListStyles, GridInfoStyles, GridRegionsStyles} from './style-components.js';

if (window.trustedTypes && trustedTypes.createPolicy) {
    trustedTypes.createPolicy('default', {
      createScriptURL: string => encodeURI(string)
    });
}

// Set meta theme color to match intensity background...
const domMetacolor = document.querySelector('meta[name="theme-color"]');
const dynamicthemecolor = !window.matchMedia('(min--moz-device-pixel-ratio: 0),(forced-colors: active)').matches;
if (domMetacolor && dynamicthemecolor) {
    document.body.addEventListener("transitionend", () => {
      try {
        domMetacolor.content = getComputedStyle(document.body).getPropertyValue("--col-background");
      } catch (err) {
        domMetacolor.content = "none";
      }
    })
}

let output = document.querySelector("#output");
let timevalid = 1000 * 60 * 33;

export class GridSources extends LitElement {

  static properties = {
    griddata: { type: Object, state: true },
    message: { type: String, state: true },
    expired: { type: Boolean }
  };

  constructor() {
    super();
    this.griddata = null;
    this.message = '';
    this.expired = false;
    this.regions = {
      "North Scotland": 1,
      "South Scotland": 2,
      "North West England": 3,
      "North East England": 4,
      "Yorkshire": 5,
      "North Wales": 6,
      "South Wales": 7,
      "West Midlands": 8,
      "East Midlands": 9,
      "East England": 10,
      "South West England": 11,
      "South England": 12,
      "London": 13,
      "South East England": 14,
      "England": 15,
      "Scotland": 16,
      "Wales": 17
    },
    this.regionsdata = '';
    this.addEventListener('refreshnow', (e) => e.detail.refresh ? this.fetchdata() : false);
    window.addEventListener("offline", (event) => {
      this.message = 'Currently offline. Displaying cached data.'
    });
  }

  connectedCallback() {
    super.connectedCallback();
    this.fetchdata();
    if (!new URL(document.location).searchParams.size) {
        this.fetchintensity();
    }
    window.addEventListener('focus', ev => {
      if (this.fetchexpired()) {
        console.error('Data has expired!');
        this.expired = true;
      }
    });
    window.setInterval(() => this.fetchfocused(), timevalid / 6);
  }
    
  regionlistener(e) {
    let url = new URL(window.location.href);
        url.searchParams.set('region', e.detail);
    history.replaceState(history.state, '', url.href);
    this.fetchdata();
    this.regionsdata = e.detail;
  }

  fetchregion(region) {
    return this.regions[region] ?? null;
  }
    
  fetchdata = async () => {
    this.message = 'Loading…';
    let generation = new URL("/generation", "https://api.carbonintensity.org.uk");
    let regionparam = new URLSearchParams(document.location.search).get('region') ?? null;
    let regionid = this.fetchregion(regionparam);
    if (regionid) {
      generation.pathname = encodeURI(`/regional/regionid/${ regionid }`);
    } else {
      generation.pathname = '/generation';
    }
    try {
      let response = await fetch(generation, {signal: AbortSignal.timeout(10000)});
      const json = await response.json();
      const dataroot = json?.data?.[0]?.data?.[0] ?? json?.data;
      if (dataroot?.generationmix.length) {
          this.expired = false;
          this.message = null;
          this.griddata = dataroot;
          if (dataroot?.intensity?.index) {
            document.body.dataset.carbon = dataroot?.intensity?.index ?? 'null';
          }
      } else {
          throw new Error(json?.error?.message ?? 'Data not currently available');
      }
    } catch (error) {
      console.error('Grid generation error', error.message);
      this.message = `Grid data error (${error.message})`;
    }
  }

  fetchintensity() {
    if (window.matchMedia('(forced-colors: active)').matches) return;
    fetch('https://api.carbonintensity.org.uk/intensity', { priority: 'low' }).then(response => {
      if (response.ok) {
        return response.json();
      }
    })
    .then(response => {
        // Apply data-carbon intensity value to body
        document.body.dataset.carbon = response?.data[0]?.intensity?.index ?? 'low';
    })
    .catch(err => console.error('Intensity Error!', err.message))
  };

  fetchexpired() {
    let timeuntil = new Date(this.griddata?.to).getTime() + timevalid;
    let timenow = new Date().getTime();
    console.warn(timenow > timeuntil)
    return timenow > timeuntil;
  }
  
  fetchfocused() {
      if (this.fetchexpired() && document.hasFocus()) {
        this.fetchdata();
        this.fetchintensity();
      }
    }

  render() {
    return html`
      <p role="status">${this.message}</p>
      <grid-list .generation=${this?.griddata?.generationmix}></grid-list>
      <grid-info from=${this?.griddata?.from} ?dataexpired=${this.expired}></grid-info>
      <grid-regions .regiondata=${this?.regions} .regionselected=${this?.regionsdata} @regionchange=${this?.regionlistener}></grid-regions>
    `
  }

}
customElements.define('grid-sources', GridSources);


// <grid-list>
export class GridList extends LitElement {

  static styles = [GridListStyles];

  static properties = {
    generation: { type: Array }
  };

  constructor() {
    super();
  }

  render() {
    return html`${this.generation ? html`
    <ul>
      ${this.generation.map((source) => html`
        <li class="cover">${source.fuel}<span class="num">${source.perc}%</span></li>
      `)}
    </ul>
    ` : html`
      <ul role="presentation">
        <li class="cover">Src<span class="num">%</span></li>
        <li class="cover">Src<span class="num">%</span></li>
        <li class="cover">Src<span class="num">%</span></li>
        <li class="cover">Src<span class="num">%</span></li>
        <li class="cover">Src<span class="num">%</span></li>
        <li class="cover">Src<span class="num">%</span></li>
        <li class="cover">Src<span class="num">%</span></li>
        <li class="cover">Src<span class="num">%</span></li>
        <li class="cover">Src<span class="num">%</span></li>
      </ul>
    `
    }`
  }
}
customElements.define('grid-list', GridList);


// <grid-info>
export class GridInfo extends LitElement {

  static styles = [GridInfoStyles];

  static properties = {
    from: { type: Date },
    dataexpired: { type: Boolean }
  };

  constructor() {
    super();
  }

  _toggleLabel() {
    if (navigator.onLine) {
      return "Updated";
    } else {
      return "Cached";
    }
  }
  
  _dateLocale(date) {
    let options = { month: "2-digit", year: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" };
    return new Intl.DateTimeFormat('en-GB', options).format(new Date(date));
  }
  
  _refresh() {
      this.dispatchEvent(new CustomEvent('refreshnow', {detail: {refresh: true}, bubbles: true, composed: true}));
  }

  render() {
    return html`${this.from ? html`
      <p class="lowlight">(${this._toggleLabel()} <time datetime="${this.from}">${this._dateLocale(this.from)}</time>) <button ?hidden=${!this.dataexpired} @click=${this._refresh}>Update Data!</button></p>
      ` : null
    }`
  }
}
customElements.define('grid-info', GridInfo);

// <grid-region>
export class GridRegions extends LitElement {

  static styles = [GridRegionsStyles]

  static properties = {
    regiondata: { type: Object },
    regionselected: { type: String }
  };

  regionparam(e) {
      let region = e.target.value;
      if (region) {
        this.dispatchEvent(new CustomEvent('regionchange', {detail: region, bubbles: true, composed: true}));
      }
  }

  render() {
    return html`
      <select @change=${this.regionparam}>
        <option .value="0">National</option>
        ${Object.keys(this.regiondata).map((region) => html`
        <option .value=${region} ?selected=${region === this.regionselected}>${region}</option>
        `)}
      </select>
    `
  }
}
customElements.define('grid-regions', GridRegions);

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
      .catch(function (error) {
        console.log('Registration failed with ' + error);
      });
  }
}

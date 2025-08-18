import { LitElement, html, render, css } from './vendor/lit-core.min.js';
import {GridListStyles, GridInfoStyles} from './style-components.js';

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
    this.addEventListener('refreshnow', (e) => e.detail.refresh ? this.fetchdata() : false);
    window.addEventListener("offline", (event) => {
      this.message = 'Currently offline. Displaying cached data.'
    });
  }

  connectedCallback() {
    super.connectedCallback();
    this.fetchdata();
    this.fetchintensity();
    window.addEventListener('focus', ev => {
      if (this.fetchexpired()) {
        console.error('Data has expired!');
        this.expired = true;
      }
    });
    window.setInterval(() => this.fetchfocused(), timevalid / 6);
  }

  fetchdata = async () => {
    this.message = 'Loading…';
    try {
      let response = await fetch('https://api.carbonintensity.org.uk/generation', {signal: AbortSignal.timeout(10000)});
      const json = await response.json();
      if (json?.data?.generationmix.length) {
          this.expired = false;
          this.message = null;
          this.griddata = json.data;
      } else {
          throw new Error(json?.error?.message ?? 'Data not currently available');
      }
    } catch (error) {
      console.error('Grid generation error', error.message);
      this.message = `Grid data error (${error.message})`;
      this.expired = true;
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
        document.body.dataset.carbon = response?.data[0]?.intensity?.index ?? 'none';
    })
    .catch((err) => {
        console.error('Intensity Error!', err.message);
        document.body.dataset.carbon = 'none';
    });
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

import { LitElement, html, render, css } from './vendor/lit-core.min.js';

if (window.trustedTypes && trustedTypes.createPolicy) {
    trustedTypes.createPolicy('default', {
      createScriptURL: string => encodeURI(string)
    });
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
    this.from = '';
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
    try {
      this.message = 'Loading…';
      let response = await fetch('https://api.carbonintensity.org.uk/generation');
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      const json = await response.json();
      if (!json?.data?.generationmix.length) throw new Error('Sorry, generation data not available currently');
      this.expired = false;
      this.message = null;
      this.griddata = json;
      this.to = json?.data?.to;
    } catch (error) {
      console.error(`Could not get products: ${error}`);
      this.message = `There was an issue fetching the data (${error.message})`;
    }
  }

  fetchintensity() {
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
    let timeuntil = new Date(this.to).getTime() + timevalid;
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
      <grid-list .generation=${this?.griddata?.data?.generationmix}></grid-list>
      <grid-info from=${this?.griddata?.data?.from} ?newdata=${this.expired}></grid-info>
    `
  }

}
customElements.define('grid-sources', GridSources);


// <grid-list>
export class GridList extends LitElement {

  static styles = css`
  ul {
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(8ch, 1fr));
    gap: 0 1rem;
  }
  .cover {
      font-size: 1.5em;
      text-transform: capitalize;
      display: inline-block;
      margin: 0;
      text-transform: capitalize;
      font-weight: normal;
  }
  .num {
      display: block;
      font-weight: bold;
      font-size: 1.125em;
      border-top: 0.0625rem solid var(--col-lowlight);
      font-variant-numeric: tabular-nums;
  }
  `;

  static properties = {
    generation: { type: Array }
  };

  constructor() {
    super();
    this.generation = [];
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

  static styles = css`
  p {
    margin: 0;
    color: var(--col-lowlight, currentColor)
  }

  button {
    background-color: transparent;
    -webkit-appearance: button;
    appearance: button;
    border: .1875rem double currentcolor;
    background-color: var(--col-background);
    color: var(--col-lowlight);
    padding: .25em .75em;
    text-transform: uppercase;
    font-weight: bold;
    font-size: initial;
  }
`;

  static properties = {
    from: { type: Date },
    newdata: { type: Boolean }
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
      <p class="lowlight">(${this._toggleLabel()} <time datetime="${this.from}">${this._dateLocale(this.from)}</time>) <button ?hidden=${!this.newdata} @click=${this._refresh}>Update Data!</button></p>
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

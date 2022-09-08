import { LitElement, html, render, css } from './lit-core.min.js';

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
  }

  connectedCallback() {
    super.connectedCallback();
    this.fetchdata();
    window.addEventListener('pageshow', ev => {
      if (this.fetchexpired()) {
        console.error('Data has expired!');
        this.expired = true;
      }
    })
  }

  fetchdata = async () => {
    try {
      let response = await fetch('https://api.carbonintensity.org.uk/generation', {
        cache: 'reload'
      });
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      const json = await response.json();
      this.expired = false;
      this.griddata = json;
      this.to = json?.data?.to;
    } catch (error) {
      console.error(`Could not get products: ${error}`);
      this.message = `There was an issue fetching the data (${error.message})`;
    }
  }

  fetchexpired() {
    let timeuntil = new Date(this.to).getTime() + timevalid;
    let timenow = new Date().getTime();
    console.warn(timenow > timeuntil)
    return timenow > timeuntil;
  }

  render() {
    return html`
      <p role="status" ?hidden=${this.griddata} class="loader">Loading...</p>
      <p role="status" ?hidden=${!this.message}>${this.message}</p>
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
    display: flex;
    flex-flow: row wrap;
    justify-content: space-between;
    padding: 0;
  }
  .cover {
      flex: 1;
      flex-basis: 90px;
      font-size: 1.5em;
      text-transform: capitalize;
      display: inline-block;
      margin: 0;
      text-transform: capitalize;
      font-weight: normal;
      margin:.25rem;
  }
  .num {
      display: block;
      font-weight: bold;
      font-size: 1.125em;
      border-top: 2px solid var(--col-lowlight);
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
    ` : null
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

  _dateLocale(date) {
    let options = { month: "2-digit", year: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" };
    return new Intl.DateTimeFormat('en-GB', options).format(new Date(date));
  }
  
  _refresh() {
      this.dispatchEvent(new CustomEvent('refreshnow', {detail: {refresh: true}, bubbles: true, composed: true}));
  }

  render() {
    return html`${this.from ? html`
      <p class="lowlight">(Updated <time datetime="${this.from}">${this._dateLocale(this.from)}</time>) <span ?hidden=${!this.newdata}>New update available! <button @click=${this._refresh}>Update</button></span></p>
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

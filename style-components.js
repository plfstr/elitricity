export const GridListStyles = css`
  ul {
    padding: 0;
    text-wrap: balance;
  }
  .cover {
      font-size: 1.5em;
      text-transform: capitalize;
      display: inline-block;
      margin: 0;
      padding: .15em;
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

export const GridInfoStyles = css`
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

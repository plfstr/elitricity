const output = document.querySelector('#output');

function buildOutput(generation) {

  if(!output) return;
  
  let domList = document.createElement('ul');
  for (let gensource of generation.data.generationmix) {
    domList.innerHTML += `<li class="cover">${gensource.fuel} <span class="num">${gensource.perc}%</span></li>`;
  };
  
  let domDatainfo = document.createElement('p');
  domDatainfo.className = 'lowlight';
  domDatainfo.textContent = `Updated ${new Date(generation.data.to).toLocaleString('en-GB')}`;

  output.innerHTML = "";
  document.querySelector('.loader').toggleAttribute('hidden');
  output.append(domList, domDatainfo);
    
}

let fetchdata = async () => {
  let response = await fetch(
    'https://api.carbonintensity.org.uk/generation', {cache: 'reload'}
  ).catch(error => {
    output.textContent = `Sorry, error fetching grid data [${error}]`;
  });
  let data = await response.json();
  try {
    buildOutput(data);
  } 
  catch(error) {
    output.textContent = `Sorry, error generating grid data (${error.name})`;
  }
};

fetchdata();
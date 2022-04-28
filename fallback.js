function buildOutput(generation) {

  var domList = document.createElement('ul');
  for (i = 0; i < generation.data.generationmix.length; i++) {
    var gensource = generation.data.generationmix[i];
    domList.innerHTML += '<li class="cover">' + gensource.fuel + '<span class="num">' + gensource.perc + '%</span></li>';
  }

  var domDatainfo = document.createElement('p');
  domDatainfo.className = 'lowlight';
  domDatainfo.textContent = 'Updated ' + new Date(generation.data.to).toLocaleString('en-GB');

  document.querySelector('#output').innerHTML = "";
  document.querySelector('.loader').setAttribute('hidden', true);
  document.querySelector('#output').append(domList, domDatainfo);

}

function fetchdata() {
  fetch('https://api.carbonintensity.org.uk/generation', { cache: 'reload' }).then(
    function (data) {
      if (data.status === 200) {
        return data.json();
      }
    }
  ).then(
    function (data) {
      try {
        buildOutput(data);
      }
      catch (error) {
        document.querySelector('.loader').setAttribute('hidden', true);
        document.querySelector('#output').textContent = 'Sorry, error generating grid data (' + error.name + ')';
      }
    }
  ).catch(
    function (error) {
      document.querySelector('.loader').setAttribute('hidden', true);
      document.querySelector('#output').textContent = 'Sorry, error fetching grid data (' + error.name + ')';
    }
  )
}

fetchdata();
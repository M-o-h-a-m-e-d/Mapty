'use strict';
// prettier-ignore

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

const App = class {
  #map;
  #savedActivities = JSON.parse(window.localStorage.getItem('savedWorkouts'));
  #activities = [];
  #date = new Date();
  #workOut = {};
  constructor() {
    this.#renderCurrentLocation();
    form.addEventListener('submit', this.#renderActivity);
    inputType.addEventListener('change', this.#switchingInputs);
    this.#loadSavedWorkouts(this.#renderHTMLWorkout);
    containerWorkouts.addEventListener('click', e => {
      const workout = e.target.closest('.workout')?.dataset.id;
      if (!workout) return;
      const position = this.#activities.find(act => act.id == workout).coords;
      this.#map.flyTo(position, 13);
      // show all workouts
      // this.#map.fitBounds(
      //   this.#activities.map(act => act.coords),
      //   { padding: [90, 90] }
      // );
    });
  }
  // prettier-ignore
  #months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  ////////////////////////////////////////////////
  // rendering current location on map
  #renderCurrentLocation() {
    navigator.geolocation.getCurrentPosition(this.#renderMap, e => {
      alert(e.message);
    });
  }
  //..............................................
  #renderMap = location => {
    const { latitude, longitude } = location.coords;
    this.#map = L.map('map').setView([latitude, longitude], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    // this.#loadSavedActivities();
    this.#loadSavedWorkouts(this.#renderMarker);
    this.#showForm();
  };
  ////////////////////////////////////////////////
  #showForm = () => {
    this.#map.on('click', location => {
      this.#workOut.type = inputType.value;
      this.#workOut.coords = [location.latlng.lat, location.latlng.lng];
      form.classList.remove('hidden');
    });
  };
  ////////////////////////////////////////////////
  #switchingInputs = () => {
    this.#workOut.type = inputType.value;
    // switching inputs
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  };
  ////////////////////////////////////////////////
  #checkInputsPositive = (...inputs) => inputs.every(input => +input >= 1);
  #checkInputsAll = (...inputs) => inputs.every(input => Math.abs(input) >= 0);
  ////////////////////////////////////////////////
  #renderActivity = e => {
    e.preventDefault();
    // prettier-ignore
    //..............................................
    // checking inputs validation
    if (
      !this.#checkInputsPositive(
        inputDistance.value,
        inputDuration.value,
        this.#workOut.type === 'running'? inputCadence.value : this.#checkInputsAll(inputElevation.value)
      )
    ) {
      alert('please enter a valid numbers');
      return;
    }
    ////////////////////////////////////////////////
    this.#workOut.id = (Date.now() + '').slice(0, 12);
    this.#date = new Date();
    this.#workOut.month = this.#months[this.#date.getMonth()];
    this.#workOut.day = this.#date.getDate();
    this.#workOut.distance = +inputDistance.value;
    this.#workOut.duration = +inputDuration.value;
    this.#workOut.type === 'running'
      ? this.#runningObject(this.#workOut)
      : this.#cyclingObject(this.#workOut);
    ////////////////////////////////////////////////
    // clearing inputs //
    // prettier-ignore
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = ''
    form.classList.add('hidden');
    form.style.display = 'none';
    setTimeout(() => {
      form.style.display = 'grid';
    }, 1000);
    this.#renderHTMLWorkout(this.#workOut);
    this.#renderMarker(this.#workOut);
  };

  #runningObject = runningObj => {
    runningObj.cadence = +inputCadence.value;
    runningObj.pace = runningObj.duration / runningObj.distance;
  };
  #cyclingObject = cyclingObj => {
    cyclingObj.elevation = +inputElevation.value;
    cyclingObj.speed = cyclingObj.distance / (cyclingObj.duration / 60);
  };
  ////////////////////////////////////////////////
  #renderHTMLWorkout = workout => {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${
      this.#workOut.id
    }">
        <h2 class="workout__title">${
          workout.type[0].toUpperCase() + workout.type.slice(1)
        } on ${this.#workOut.month} ${this.#workOut.day}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
        </div>
        `;
    if (workout.type === 'running') {
      const runninghtml = `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>`;
      html += runninghtml;
    } else {
      const cyclinghtml = `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">KM/H</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevation}</span>
          <span class="workout__unit">M</span>
        </div>
      </li>`;
      html += cyclinghtml;
    }

    form.insertAdjacentHTML('afterend', html);
  };
  ////////////////////////////////////////////////
  #renderMarker = workout => {
    // if (!this.#map) {
    //   let map = document.getElementById('map');
    //   map.style.display = 'flex';
    //   map.style.textAlign = 'center';
    //   map.style.justifyContent = 'center';
    //   map.style.alignItems = 'center';
    //   map.style.fontSize = 'center';
    //   map.style.color = 'green';
    //   map.innerHTML =
    //     "<h1><p style='color:red'>⚠</p>Sorry couldn't get the map<br>Check your connection and try again</h1>";
    //   return;
    // }
    const content = `${
      workout.type === 'running' ? '🏃‍♂️ Running' : '🚴‍♀️ Cycling'
    } on ${workout.month} ${workout.day}`;

    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          closeButton: false,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        }).setContent(content)
      )
      .openPopup();
    //  updating activities
    this.#activities.push(workout);
    window.localStorage.setItem(
      'savedWorkouts',
      JSON.stringify(this.#activities)
    );
    // clearing current activity
    this.#workOut = {};
    // this.#activities = JSON.parse(window.localStorage.getItem('savedWorkouts'));
  };
  #loadSavedWorkouts = callback => {
    this.#savedActivities?.forEach(activity => {
      this.#workOut = activity;
      callback(this.#workOut);
    });
  };
};
const app = new App();

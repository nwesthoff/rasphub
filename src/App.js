import React, { Component } from 'react';
import './App.css';


class PlayerStatus extends Component {
  render(){
    return(
      <h2 className="player__status">Now Playing</h2>
    )
  }
}

class PlayerTitle extends Component {
  render(){
    let title = "Singularity"

    return(
      <h2 className="player__title">{title}</h2>
    )
  }
}

class PlayerArtists extends Component {
  render(){
    let artists = [
      "Jon Hopkins"
    ]

    return(
      <h2 className="player__artists">{artists}</h2>
    )
  }
}

class Player extends Component {
  render() {
    return (
      <section className="section">
        <div>
          <img />
        </div>
        <div>
          <PlayerStatus />
          <PlayerTitle />
          <PlayerArtists />
        </div>
      </section>
    )
  }
}

class App extends Component {
  render() {

    return (
      <div className="App">
        <Player />
      </div>
    );
  }
}

export default App;

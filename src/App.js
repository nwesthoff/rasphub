import React, { Component } from 'react';
import './App.css';
import queryString from 'query-string'


class PlayerStatus extends Component {

  render(){
    let status = ""

    this.props.status ? status = "Now Playing" : status = "Played Last"

    return(
      <h2 className="player__status">{status}</h2>
    )
  }
}

class PlayerProgress extends Component {

  render(){
    let progressPercentage = (this.props.progress/this.props.duration)*100

    return(
      <div className="player__progress-bar">
        <div className="player__progress-bar__progress" style={{width: progressPercentage + '%'}}></div>
      </div>
    )
  }
}

class PlayerTitle extends Component {

  render(){
    return(
      <h2 className="player__title">{this.props.title}</h2>
    )
  }
}

class PlayerArtists extends Component {

  render(){
    let artists = this.props.artists.map(x => x.name).toString()

    return(
      <h2 className="player__artists">{artists}</h2>
    )
  }
}

class Button extends Component {
  render(){
    return (
      <button onClick={() => {
            window.location = window.location.href.includes('localhost')
              ? 'http://localhost:8888/login'
              : 'https://rasphub-backend.herokuapp.com/login' }
          } >Log in to Spotify</button>
    )
  }
}

class Player extends Component {
  constructor() {
    super()
    this.state = {
      user: {},
      player: {},
      accessToken: ""
    }

    this.fetchUser = this.fetchUser.bind(this)
    this.fetchPlayer = this.fetchPlayer.bind(this)
  }

  componentWillMount() {
    let parsed = queryString.parse(window.location.search)
    this.setState({accessToken: parsed.access_token})
  }

  componentDidMount() {

    if (!this.state.accessToken)
      return

    this.fetchUser()
    this.fetchPlayer()
    this.timerID = setInterval(() => this.fetchPlayer(), 5000)
  }

  componentWillUnmount() {
    clearInterval(this.timerID);
  }

  fetchUser() {
    fetch('https://api.spotify.com/v1/me', {
      headers: {'Authorization': 'Bearer ' + this.state.accessToken}
    })
    .then(response => response.json())
    .then(userData => this.setState({
        user: {
          name: userData.display_name
        }
      }
    ))
  }

  fetchPlayer() {
    fetch('https://api.spotify.com/v1/me/player', {
      headers: {'Authorization': 'Bearer ' + this.state.accessToken}
    })
    .then(response => response.json())
    .then(playerData => this.setState(
      {player: {
        item: playerData.item,
        is_playing: playerData.is_playing,
        progress_ms: playerData.progress_ms
      }}
    ))

  }

  render() {

    return (
      <section className="player">
        { this.state.user.name ?
          <div>
            {this.state.player.item ?
              <div>
              <div>
                <img src={this.state.player.item.album.images[0].url} className="player__art" alt=""/>
              </div>
              <div>
                <PlayerStatus status={this.state.player.is_playing}/>
                <PlayerProgress progress={this.state.player.progress_ms} duration={this.state.player.item.duration_ms} />
                <PlayerTitle title={this.state.player.item.name}/>
                <PlayerArtists artists={this.state.player.item.artists} />
              </div>
              </div> : <h2>Loading...</h2>
            }
          </div> : <Button />
        }
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

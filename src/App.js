import React, { Component } from 'react';
import './App.css';
import queryString from 'query-string'
import * as Vibrant from 'node-vibrant'


class PlayerStatus extends Component {

  render(){
    let statusText = "",
        playerStatusStyle = {
          display: 'flex',
          flexFlow: 'row wrap',
          alignItems: 'center'
        },
        statusStyle = {
          width: '400px',
          fontSize: '20px',
          margin: "-.3rem .8rem .1rem",
          textTransform: 'uppercase',
          fontWeight: 900,
          letterSpacing: '1px'
        },
        playBlockStyle = {
          color: 'white',
          height: '25px',
          width: '25px',
          padding: '3px',
          background: this.props.color
        }

    this.props.status ? statusText = "Now Playing" : statusText = "Played Last"

    return(
      <div style={playerStatusStyle}>
        <div style={playBlockStyle}><i className="fas fa-play" /></div>
        <div>
          <h2 style={statusStyle} >{statusText}</h2>
          <PlayerProgress progress={this.props.progress} color={this.props.color} duration={this.props.duration}/>
        </div>
      </div>
    )
  }
}

class PlayerProgress extends Component {

  render(){
    let progressPercentage = (this.props.progress/this.props.duration)*100

    let progressBarStyle = {
      width: progressPercentage + "%",
      height: '3px',
      background: this.props.color,

      transition: 'width 400ms linear'
    }

    let progressStyle = {
      width: '5rem',
      margin: '0 .8rem',
      background: 'rgba(0,0,0,0.5)'
    }

    return(
      <div style={progressStyle}>
        <div style={progressBarStyle}></div>
      </div>
    )
  }
}

class PlayerTitle extends Component {

  render(){
    let titleStyle = {
      width: '400px',
      fontSize: '28px',
      margin: "1.2rem 0 .2rem",
      fontWeight: 700,
      letterSpacing: '1px'
    }

    return(
      <h2 className="player__title" style={titleStyle} >{this.props.title}</h2>
    )
  }
}

class PlayerArtists extends Component {

  render(){
    let artists = this.props.artists.map(x => x.name).join(', '),
        artistsStyle = {
          width: '400px',
          fontSize: '24px',
          margin: ".4rem 0 .2rem",
          fontWeight: 400,
          letterSpacing: '1px'
        }

    return(
      <h2 className="player__artists" style={artistsStyle}>{artists}</h2>
    )
  }
}

class Button extends Component {
  render(){
    return (
      <button className="button" onClick={() => {
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
      accessToken: "",
      palette: {
        Vibrant: 'orange',
        Muted: 'orange',
        DarkVibrant: 'orange',
        DarkMuted: 'orange',
        LightMuted: 'orange',
      }
    }

    this.fetchUser = this.fetchUser.bind(this)
    this.fetchPlayer = this.fetchPlayer.bind(this)
  }

  componentWillMount() {
    let access_token = ""

    if (window.localStorage.getItem('access_token')) {
      access_token = window.localStorage.getItem('access_token')
    } else {
      let parsed = queryString.parse(window.location.search)
      window.localStorage.setItem('access_token', parsed.access_token)
      access_token = window.localStorage.getItem('access_token')
    }

    this.setState({accessToken: access_token})
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
    .catch(error => console.log(error))
  }

  fetchLastPlayed(){
    fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
      headers: {'Authorization': 'Bearer ' + this.state.accessToken}
    })
    .then(response => response.json())
    .then(lastPlayedData => this.setState(
      {player: {
        item: lastPlayedData.items[0].track,
        is_playing: false,
        progress_ms: lastPlayedData.progress_ms
      }}
    ))
  }

  fetchPlayer() {
    function parseJson(response){
      return response.text().then(function(text) {
        return text ? JSON.parse(text) : {}
      })
    }

    fetch('https://api.spotify.com/v1/me/player', {
      headers: {'Authorization': 'Bearer ' + this.state.accessToken}
    })
    .then(parseJson)
    .then(playerData => {
        if (Object.keys(playerData).length !== 0) {
          this.setState(
            {player: {
              item: playerData.item,
              is_playing: playerData.is_playing,
              progress_ms: playerData.progress_ms
            }}
          )
          this.setVibrant()
        } else {
          this.fetchLastPlayed()
        }
      }
    )
    .catch(error => console.log(error))
  }

  hexToRgba(hex, opacity) {
    hex = hex.replace('#','');
    let r = parseInt(hex.substring(0,2), 16);
    let g = parseInt(hex.substring(2,4), 16);
    let b = parseInt(hex.substring(4,6), 16);

    let result = 'rgba('+r+','+g+','+b+','+opacity/100+')';
    return result;
  }

  setVibrant() {
    Vibrant.from(document.querySelector("#playerArt").src).getPalette()
      .then(palette => this.setState(
        {palette: {
          Vibrant:  palette.Vibrant ? palette.Vibrant.getHex() : 'red',
          Muted: palette.Muted ? palette.Muted.getHex() : 'red',
          DarkVibrant: palette.DarkVibrant ? palette.DarkVibrant.getHex() : 'red',
          DarkMuted: palette.DarkMuted ? palette.DarkMuted.getHex() : 'red',
          LightMuted: palette.LightMuted ? palette.LightMuted.getHex() : 'red',
        }}
      ))

    console.log(this.state.palette)
  }

  render() {
    let DarkVibrantRgba = this.hexToRgba(this.state.palette.DarkVibrant, 3)

    let playerStyle = {
      height: '533px',
      width: '100%',
      display: 'flex',
      flexFlow: 'row nowrap',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(to right, ' +this.state.palette.DarkVibrant+ ' 30%, ' +DarkVibrantRgba+ ' 30%)'
    }

    let playerArtStyle = {
      height: '260px',
      boxShadow: '0 15px 35px rgba(0,0,0,0.15), 25px 25px 0 ' + this.state.palette.Vibrant,
      marginRight: '5rem'
    }

    return (

      <div>
        { this.state.user.name ?
          <div>
            {this.state.player.item ?
              <section className="player" style={playerStyle}>
                <div>
                  <img id="playerArt" src={this.state.player.item.album.images[0].url} style={playerArtStyle} alt=""/>
                </div>
                <div>
                  <PlayerStatus
                    status={this.state.player.is_playing}
                    color={this.state.palette.Vibrant}
                    progress={this.state.player.progress_ms}
                    duration={this.state.player.item.duration_ms} />
                  <PlayerTitle title={this.state.player.item.name} />
                  <PlayerArtists artists={this.state.player.item.artists} />
                </div>
              </section> : <h2>Loading...</h2>
            }
          </div> : <Button />
        }
      </div>
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

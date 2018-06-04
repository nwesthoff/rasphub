import React, { Component } from 'react';
import './App.css';
import queryString from 'query-string'
import * as Vibrant from 'node-vibrant'

function formatDate(date) {
  let result = ""
  result = (date) ? new Date(date).toDateString() : ""
  return result
}

class PlayerStatus extends Component {

  render(){
    let statusText = "",
        playerStatusStyle = {
          display: 'flex',
          flexFlow: 'row wrap',
          alignItems: 'center'
        },
        statusStyle = {
          width: '275px',
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
      width: '275px',
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
          width: '275px',
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

class Playlists extends Component {

  render() {
    let playlistsStyle = {
      width: '250px',
      height: '100%',
      background: this.props.color,
      transition: 'all 250ms ease-in-out'
    }
    return (
      <div style={playlistsStyle}>
        <h2 style={{fontSize: '16px', margin: '25px 25px 15px', textTransform: 'uppercase'}}><i className="fab fa-spotify"></i> New Tracks</h2>
      </div>
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
    this.parseJson = this.parseJson.bind(this)
  }

  componentWillMount() {
    let parsed = queryString.parse(window.location.search),
        access_token = window.localStorage.getItem('access_token')

    if ('access_token' in parsed) {
      localStorage.setItem('access_token', parsed.access_token)
      access_token = parsed.access_token
    }


    this.setState({
      accessToken: access_token
    })
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

  handleErrors(response) {
    if (!response.ok) {
      localStorage.clear()
      throw Error(response.statusText)
    }
    return response;
  }

  parseJson(response){
    return response.text().then(function(text) {
      return text ? JSON.parse(text) : {}
    })
  }

  fetchUser() {
    fetch('https://api.spotify.com/v1/me', {
      headers: {'Authorization': 'Bearer ' + this.state.accessToken}
    })
    .then(response => {
      this.handleErrors(response)
      return response.clone()
    })
    .then(responseBlob => responseBlob.json())
    .then(userData => this.setState({
      user: {
        name: userData.display_name
      }
    }))
    .catch(error => console.log(error))
  }

  fetchLastPlayed(){
    fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
      headers: {'Authorization': 'Bearer ' + this.state.accessToken}
    })
    .then(response => {
      this.handleErrors(response)
      return response.clone()
    })
    .then(response => response.json())
    .then(lastPlayedData => {
      if (lastPlayedData.progress_ms !== this.state.player.progress_ms) {
        this.setState(
          {player: {
            item: lastPlayedData.items[0].track,
            is_playing: false,
            progress_ms: lastPlayedData.progress_ms
          }}
        )
      }
    })
    .catch(error => console.log(error))
  }

  fetchPlayer() {
    fetch('https://api.spotify.com/v1/me/player', {
      headers: {'Authorization': 'Bearer ' + this.state.accessToken}
    })
    .then(response => {
      this.handleErrors(response)
      return response.clone()
    })
    .then(this.parseJson)
    .then(playerData => {
        if (Object.keys(playerData).length !== 0) {
          if (playerData.progress_ms !== this.state.player.progress_ms) {
            this.setState(
              {player: {
                item: playerData.item,
                is_playing: playerData.is_playing,
                progress_ms: playerData.progress_ms
              }}
            )
          }
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
          Vibrant:  palette.Vibrant ? palette.Vibrant.getHex() : '#1ed760',
          Muted: palette.Muted ? palette.Muted.getHex() : '#191414',
          DarkVibrant: palette.DarkVibrant ? palette.DarkVibrant.getHex() : '#1db954',
          DarkMuted: palette.DarkMuted ? palette.DarkMuted.getHex() : '#1e3264',
          LightMuted: palette.LightMuted ? palette.LightMuted.getHex() : '#509bf5',
        }}
      ))

    // console.log(this.state.palette)
  }

  render() {
    let BackgroundLight = this.hexToRgba(this.state.palette.DarkMuted, 3),
        BackgroundMedium = this.hexToRgba(this.state.palette.DarkMuted, 15),
        spotifyPlayerStyle = {
          height: '420px',
          position: 'relative',
          display: 'flex',
          flexFlow: 'row nowrap'
        },
        playerStyle = {
          height: '100%',
          width: '650px',
          display: 'flex',
          flexFlow: 'row nowrap',
          justifyContent: 'center',
          alignItems: 'center',
          background: BackgroundLight
        },
        playerArtStyle = {
          height: '200px',
          boxShadow: '0 15px 35px rgba(0,0,0,0.15), 25px 25px 0 ' + this.state.palette.Vibrant,
          marginRight: '3rem',
          transition: 'all 400ms ease-in-out'
        }

    return (

      <div >
        { this.state.user.name ?
          <section className="spotifyPlayer" style={spotifyPlayerStyle}>
            {this.state.player.item ?
              <div className="player" style={playerStyle}>
                <div>
                  <div style={{height: '100%', width: '220px', backgroundColor: this.state.palette.DarkMuted, position: 'absolute', top: '0px', left: '0px', zIndex: -1, transition: 'all 400ms ease-in-out'}}></div>
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
              </div> : <h2>Loading...</h2>
            }
            {this.state.user.name ?
                <Playlists
                  className="playlists"
                  color={BackgroundMedium}/> : <h2>Loading...</h2>
            }
          </section> : <Button />
        }
      </div>
    )
  }
}

class Weather extends Component {
  render() {
    let weatherStyle = {
      'height': '420px',
      'backgroundColor': '#0f0f0f'
    }

    return(
      <section className="weather" style={weatherStyle}>

      </section>
    )
  }
}

class MovieCalendar extends Component {
  constructor() {
    super()
    this.state = {
      movie: {},
    }
  }

  componentDidMount() {
    this.fetchMovieCalendar()
    this.timerID = setInterval(() => this.fetchMovieCalendar(), 120000)
  }

  componentWillUnmount() {
    clearInterval(this.timerID);
  }

  handleErrors(response) {
    if (!response.ok) {
      throw Error(response.statusText)
    }
    return response;
  }

  fetchMovieCalendar() {
    let fetchUri = (window.location.href.includes('localhost'))
      ? 'http://localhost:8888/moviecalendar'
      : 'https://rasphub-backend.herokuapp.com/moviecalendar'

    fetch(fetchUri)
    .then(response => {
      this.handleErrors(response)
      return response.clone()
    })
    .then(responseBlob => responseBlob.json())
    .then(movieData => {
      movieData = movieData.slice(0, 7)

      let movieArray = movieData.map(movie => {

        let movieObj = {}
        movieObj["title"] = movie.title
        movieObj["poster"] = "http://radarr.gladosplex.nl" + movie.images[0].url
        movieObj["id"] = movie.tmdbId
        movieObj["releaseDate"] = movie.physicalRelease
        return movieObj
      })

      this.setState({
        movies: movieArray
      })
    })
    .catch(error => console.log(error))
  }

  render() {
    let movieCalendarStyle = {
      padding: '15px 0',
      height: '300px',
      width: '100%',
      background: 'rgba(240, 173, 78, .04)'
    }

    return(
      <section className="moviecalendar" style={movieCalendarStyle}>
        <h2 style={{fontSize: '16px', margin: '0 25px 15px', textTransform: 'uppercase'}}><i className="fas fa-film"></i> Upcoming Movies</h2>
        {this.state.movies ?
          <div style={{display: 'flex', flexFlow: 'row nowrap', justifyContent: 'space-between', margin: '5px 25px', overflow: 'hidden'}}>
            {this.state.movies.map(movie => (
              <div className="movie" key={movie.id} style={{maxWidth: '110px'}}>
                <img src={movie.poster} style={{width: '100%', height: 'auto'}}  alt={movie.title + ' poster'}/>
                <h5 style={{margin: '8px 0 4px'}}>{movie.title}</h5>
                <h6 style={{fontWeight: '400', margin: '4px 0'}}>{formatDate(movie.releaseDate)}</h6>
              </div>
            ))}
          </div> : <h2>Loading...</h2>
        }
      </section>
    )
  }
}

class SeriesCalendar extends Component {
  constructor() {
    super()
    this.state = {
      series: {},
    }
  }

  componentDidMount() {
    this.fetchMovieCalendar()
    this.timerID = setInterval(() => this.fetchMovieCalendar(), 120000)
  }

  componentWillUnmount() {
    clearInterval(this.timerID);
  }

  handleErrors(response) {
    if (!response.ok) {
      throw Error(response.statusText)
    }
    return response;
  }

  fetchMovieCalendar() {
    let fetchUri = (window.location.href.includes('localhost'))
      ? 'http://localhost:8888/seriescalendar'
      : 'https://rasphub-backend.herokuapp.com/seriescalendar'

    fetch(fetchUri)
    .then(response => {
      this.handleErrors(response)
      return response.clone()
    })
    .then(responseBlob => responseBlob.json())
    .then(seriesData => {
      seriesData = seriesData.slice(0, 7)

      let seriesArray = seriesData.map(series => {

        let seriesObj = {}
        seriesObj["title"] = series.series.title
        seriesObj["poster"] = series.series.images[2].url
        seriesObj["id"] = series.series.tvdbId
        seriesObj["releaseDate"] = series.airDate
        return seriesObj
      })

      this.setState({
        seriess: seriesArray
      })
    })
    .catch(error => console.log(error))
  }

  render() {
    let seriesCalendarStyle = {
      padding: '20px 0',
      height: '300px',
      width: '100%',
      background: 'rgba(53, 197, 244, .04)'
    }

    return(
      <section className="seriescalendar" style={seriesCalendarStyle}>
        <h2 style={{fontSize: '16px', margin: '0 25px 15px', textTransform: 'uppercase'}}><i className="fas fa-tv"></i> Upcoming Episodes</h2>
        {this.state.seriess ?
          <div style={{display: 'flex', flexFlow: 'row nowrap', justifyContent: 'space-between', margin: '5px 25px', overflow: 'hidden'}}>
            {this.state.seriess.map(series => (
              <div className="series" key={series.id} style={{maxWidth: '110px'}}>
                <img src={series.poster} style={{width: '100%', height: 'auto'}}  alt={series.title + ' poster'}/>
                <h5 style={{margin: '8px 0 4px'}}>{series.title}</h5>
                <h6 style={{fontWeight: '400', margin: '4px 0'}}>{formatDate(series.releaseDate)}</h6>
              </div>
            ))}
          </div> : <h2>Loading...</h2>
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
        <Weather />
        <MovieCalendar />
        <SeriesCalendar />
      </div>
    );
  }
}

export default App;

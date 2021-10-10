import React from 'react'
import './App.css';
import axios from 'axios';
import _ from 'lodash'

const LEADERBOARD_SHEET_URL = 'https://sheet.best/api/sheets/c8a33913-934c-4263-8019-447ac2a6777f';

class App extends React.Component{

  constructor() {
    super();

    this.state = {
      selectedWinner: '',
      selectedLoser: '',
      leaderboard: [],
      isSubmitting: false,
      isLoading: true
    }
  }

  async componentDidMount() {
    const leaderboard = (await this.getPingPongLeaderboard()).sort((row1, row2) => row2['Elo'] - row1['Elo'])
    // const leaderboard = [
    //   {
    //     'Player Name': 'Andrew',
    //     'Elo': '1500',
    //     'id': '0'
    //   },
    //   {
    //     'Player Name': 'Dillon',
    //     'Elo': '1500',
    //     'id': '1'
    //   },
    //   {
    //     'Player Name': 'Brian',
    //     'Elo': '1500',
    //     'id': '2'
    //   },
    //   {
    //     'Player Name': 'Paul',
    //     'Elo': '1500',
    //     'id': '3'
    //   },{
    //     'Player Name': 'Alex',
    //     'Elo': '1500',
    //     'id': '4'
    //   }

    // ]
    this.setState({leaderboard, isLoading: false})
  }

  getPingPongLeaderboard() {
    return axios.get(LEADERBOARD_SHEET_URL)
    .then(response => response.data);
  }

  renderSubmitOptions(nameToDisable) {
    return (<>
    <option className='none-option'></option>
    {
      this.state.leaderboard.map(row => {
        const playerName = row['Player Name'];
        if(playerName === nameToDisable) {
          return <option disabled value={row['Player Name']} key={row['Player Name']}>{row['Player Name']}</option>
        }
        return <option value={row['Player Name']} key={row['Player Name']}>{row['Player Name']}</option>
      })
    } </>);
  }
  
  async submitNewMatch() {
    if(this.state.selectedWinner === '' || this.state.selectedLoser === '') {
      return;
    }
    const leaderBoardClone = _.cloneDeep(this.state.leaderboard)
    const winnerRow = leaderBoardClone.find(row => row['Player Name'] === this.state.selectedWinner);
    const loserRow = leaderBoardClone.find(row => row['Player Name'] === this.state.selectedLoser);

    if (winnerRow === undefined || loserRow === undefined) {
      return
    }

    this.setState({isLoading: true}, async () => {
      const probabilityOfWinnerWinningNormalized = Math.round((1 / (1 + Math.pow(10, ((loserRow['Elo'] - winnerRow['Elo']) /400)))) * 100)
      const winnerNewElo =  parseInt(winnerRow['Elo']) + (100 - probabilityOfWinnerWinningNormalized)
      const loserNewElo =  parseInt(loserRow['Elo']) - (100 - probabilityOfWinnerWinningNormalized)
  
      await Promise.all([axios.patch(`${LEADERBOARD_SHEET_URL}/${loserRow.id}`, { Elo: loserNewElo }), axios.patch(`${LEADERBOARD_SHEET_URL}/${winnerRow.id}`, { Elo: winnerNewElo })])
  
      this.setState({ isSubmitting: false, leaderboard: await this.getPingPongLeaderboard(), isLoading: false });
    })
  }

  render() {

    return (
    <div className='app-container'>
      <div className='title-text'>Disknee Ping Pong Leaderboard</div>
      {
        this.state.isLoading ? <div className='loading'> Loading... </div> : <div> 
          <div className='leaderboard-text-container'>
          {this.state.leaderboard.map(row => {
            return (
              <div className='leaderboard-text' key={row['Player Name']}>
                <span>{row['Player Name']}</span>
                <span>{row['Elo']}</span>
              </div>
            )
          })}
        </div>
        {!this.state.isSubmitting && 
          <div className='button' onClick={() => this.setState({isSubmitting: true})}>
            Submit New Match
          </div>}
        {this.state.isSubmitting &&
          <div className='submission-form'>
            <div>
              <span className='select-label'>Winner</span>
              <select className='player-drop-down' onChange={e => this.setState({selectedWinner: e.target.value})}>
                {this.renderSubmitOptions(this.state.selectedLoser)}
              </select>
              <span className='select-label'>Loser</span>
              <select className='player-drop-down' onChange={e => this.setState({selectedLoser: e.target.value})}> 
                {this.renderSubmitOptions(this.state.selectedWinner)}
              </select>
            </div>
            <div className='button' onClick={() => this.submitNewMatch()}>Submit</div>
          </div>}
        </div>
      }
    </div>
  );
  }
}

export default App;

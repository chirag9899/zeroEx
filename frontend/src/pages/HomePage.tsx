import Balance from '../components/Balance'
import LSidebar from '../components/LSidebar'
import Market from '../components/Market'
import RSidebar from '../components/RSidebar'
import Watchlist from '../components/Watchlist'


const HomePage = () => {
  return (
    <div className='pl-24 pr-96 m-6'>
      <LSidebar/>
          <div className='grid grid-cols-2 gap-x-6 gap-y-8'>
            <Balance/>
            <Watchlist/>
            <div className='col-span-2'>
              <Market/>
            </div>
          </div>
      <RSidebar/>
    </div>
  )
}

export default HomePage

import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'



const data = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 800 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 1200 },
  { name: 'May', value: 900 },
  { name: 'Jun', value: 1500 },
  { name: 'Jul', value: 1800 },
  { name: 'Aug', value: 2000 },
  { name: 'Sep', value: 2200 },
  { name: 'Oct', value: 2500 },
  { name: 'Nov', value: 2700 },
  { name: 'Dec', value: 3000 },
  
]

const Dashboard = () => {
  const cardStyle = {
    background: '#fff',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
    margin: '10px',
    flex: 1,
    minWidth: '240px',
  }

  const sectionStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
    padding: '20px',
  }

  return (
    <div style={{ padding: '30px', background: '#f5f8fb', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '20px' }}>Admin Dashboard</h1>

      <div style={sectionStyle}>
        <div style={cardStyle}>
          <h3>Users</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>1,415</p>
        </div>
        <div style={cardStyle}>
          <h3>Bookings</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>2,057</p>
        </div>
        <div style={cardStyle}>
          <h3>Conversion Rate</h3>
          <div style={{ width: 80, margin: 'auto' }}>
            <CircularProgressbar
              value={52}
              text="52%"
              styles={buildStyles({
                textColor: '#333',
                pathColor: '#007bff',
                trailColor: '#d6d6d6',
              })}
            />
          </div>
          <p style={{ fontSize: '14px', marginTop: '10px' }}>24500 views / 17200 leads</p>
        </div>
      </div>

      <div style={cardStyle}>
        <h3>Traffic Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#007bff" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default Dashboard

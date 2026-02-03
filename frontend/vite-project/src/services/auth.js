import axios from 'axios'


export async function loginUser(login, password) {
  const response = await axios.post(`${VITE_API_URL}/login`, {
    login,
    password
  })

  // Guardar token y usuario
  localStorage.setItem('accessToken', response.data.accessToken)
  localStorage.setItem('userData', JSON.stringify(response.data.userData))

  return response.data
}

export function logoutUser() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('userData')
}

export function getAccessToken() {
  return localStorage.getItem('accessToken')
}

export function getUserData() {
  const data = localStorage.getItem('userData')
  return data ? JSON.parse(data) : null
}
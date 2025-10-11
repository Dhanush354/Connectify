import { createAsyncThunk, createSlice } from  '@reduxjs/toolkit'
import toast from 'react-hot-toast'
import api from '../../api/axios';

const initialState = {
    value: null,
    loading: false,
}

export const fetchUser= createAsyncThunk('user/fetchUser', async (token) => {
    console.log('Fetching user with token:', token); 
    const {data}=await api.get('/api/user/data',{
        headers:{
            Authorization:`Bearer ${token}`
        }
    })
    console.log('api response',data);
    return data.success ? data.user : null
})

export const updateUser= createAsyncThunk('user/updateUser', async ({userData,token}) => {
    const {data}=await api.post('/api/user/update',userData,{
        headers:{
            Authorization:`Bearer ${token}`
        }
    })
    if(data.success){
        toast.success(data.message)
        return data.user
    }else{
        toast.error(data.message)
        return null
    }
})


const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {

  },
//   extraReducers: (builder) => {
//     builder.addCase(fetchUser.fulfilled, (state, action) => {
//         state.value = action.payload
//     }).addCase(updateUser.fulfilled, (state, action) => {
//         state.value = action.payload
//     })
//   }
    extraReducers: (builder) => {
    builder
        .addCase(fetchUser.pending, (state) => {
        state.loading = true;
        })
        .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading = false;
        state.value = action.payload;
        })
        .addCase(fetchUser.rejected, (state) => {
        state.loading = false;
        })
        .addCase(updateUser.fulfilled, (state, action) => {
        state.value = action.payload;
        });
}


})

export default userSlice.reducer
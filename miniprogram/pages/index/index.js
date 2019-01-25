//index.js
const app = getApp()

Page({
  data: {
    user_id : ''
  },

  onLoad: function() {
    
  },
  bindKeyInput(e) {
    this.setData({
      user_id: e.detail.value
    })
    console.log(this.data);
  },
  submit(){
    let that = this;
    wx.navigateTo({
      url: `../post/post?user_id=${that.data.user_id}`
    })
  }

})
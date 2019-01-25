// miniprogram/pages/post/post.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    list: [],
    height: '180px'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let user_id = options.user_id;
    let height =  wx.getSystemInfoSync().windowWidth / 3 * 1.48 + 'px'
    this.setData({
      height
    })
    this.getList(user_id);

  },
  getList: function (user_id) {
    let that = this;
    wx.cloud.callFunction({
      // 云函数名称
      name: 'getPostList',
      // 传给云函数的参数
      data: {
        user_id: '119105254',
      },
    })
      .then(res => {
        console.log(res.result);
        that.setData({
          list: res.result.result
        })
        console.log(that.list);
      })
      .catch(console.error)
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})
var $ = require('../../utils/ajax.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    stations: [],
    videoIntros: [],
    loadMore: 0,
    pageNum: 1,
    pageSize: 4,
    canLoadMore: '1',          // 是否可以加载更多视频数据
    scrollTop: 0               // 搜索组件根据页面滚动高度设置透明度
  },
  /**
   * 加载视频数据
   */
  loadMovies: function (pageNum, pageSize) {
    $.get({
      url: "https://www.yanda123.com/yanda/movie/getPubMovies",
      data: { pageNum: pageNum, pageSize: pageSize }
    }).then((res) => {
      if (res.data.status === 200) {
        let movies = res.data.data.list,
          pageNum = this.data.pageNum;
        movies.length >= 4 ? (pageNum++) : (this.setData({ canLoadMore: '0' }));
        this.groupvideoIntros({
          movies: movies,
          pageNum: pageNum
        });
      }
    }).catch((err) => {
      console.log(err);
    });
  },
  /**
   * 组合 videoIntros 数据
   */
  groupvideoIntros(data) {
    let videoIntros = this.data.videoIntros,
      movies = data.movies,
      pageNum = data.pageNum;
    for (let i = 0; i < movies.length; i++) {
      let movie = movies[i];
      movie.imgUrl = 'https://www.yanda123.com/yanda/attach/readFile?size=500&id=' + movies[i].imgAppendixId;
      videoIntros.push(movie);
    }
    this.setData({
      videoIntros: videoIntros,
      pageNum: pageNum
    })
  },
  /**
  * 加载分类
  */
  loadClassify: function () {
    var that = this;
    $.get({ url: 'https://www.yanda123.com/yanda/movie/getClassify' })
      .then((res) => {
        if (res.statusCode == 200) {
          let data = res.data;
          let classifies = data;
          for (let i = 0; i < classifies.length; i++) {
            classifies[i].imgUrl = classifies[i].iconUrl;
          }
          that.setData({
            stations: classifies
          });
        }
      }).catch((err) => {
        console.log(err);
      });
  },

  loadBanners: function () {
    var that = this;
    $.get({
      url: 'https://www.yanda123.com/yanda/banner/list',
      data: { pageNum: 1, pageSize: 4 }
    }).then((res) => {
      if (res.data.status == 200) {
        let data = res.data.data.list;
        let urlArr = [];
        for (let i = 0; i < data.length; i++) {
          let url = 'https://www.yanda123.com/yanda/attach/readFile?size=800&id=' + data[i].appendixId;
          urlArr.push(url);
        }
        that.setData({
          imgUrls: urlArr
        });
      }
    }).catch((err) => {
      console.log(err);
    });
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.loadBanners();
    this.loadClassify();
    this.loadMovies(this.data.pageNum, this.data.pageSize);
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
  * 页面上拉触底事件
  */
  onReachBottom() {
    if (this.data.canLoadMore === '1') {
      this.loadMovies(this.data.pageNum, this.data.pageSize);
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  /**
   * 页面滚动
   */
  onPageScroll: function (e) {
      this.setData({
        scrollTop: e.scrollTop
      });
  }
})
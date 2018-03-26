const utils = require('../../utils/util.js');
const $ = require('../../utils/ajax.js'),
      commentStore = require('../../store/commentStore.js');
const REFRESH = 1,
      PAGE_SIZE = 3;

var _canLoadMore = 'commentData.canLoadMore',
    _commentList = 'commentData.commentList',
    _video = 'videoData.video';

Page({

  /**
   * 页面的初始数据
   */
  data: {
    mvId: '',            //从页面传过来的视频ID参数
    episodeCount: '',
    showCenterPlayBtn: false,
    selected: '1',        // 决定显示视频组件或者评论组件, '1'代表视频组件, '2'代表评论组件
    videoData: {        // 视频组件的状态数据
      video: {
        mvSrc: '',                           // 视频地址
        imgSrc: '',                           //视频封面地址
        episodeName: '我是陈大牛',                  // 视频标题
        episodeIntro: '这是唐代诗人王维创作的一首劝慰友人落第的诗',
        series: '国学/唐诗系列',                 // 系列  
        episodeCount: 20,                       // 集数
        episodeId: '1',                          // 视频id
        episodeNum: 0                           // 当前正在播放的集数          
      },
      showVideoHiddenIntro: '0',  //  控制隐藏简介的显示状态, '1'代表显示
      playing: 0,               // 正在播放的集数，控制绿色三角形的显示
      showHideEpisode: '0'      // 控制全部集数的组件的显示状态, '1'代表显示
    },
    commentData: {   
      criteria: '1',            // 评论的展示类型 1最新 2所有 3精华
      commentList: [],          // 评论列表数
      modelInput: '0',           // 评论模态框的展示, 0 隐藏, 1 显示
      canLoadMore: '1',
      modelChildComment: '0',
      parentComment: {}       // 用于存储父评论，当要获取某一评论的所有子评论时，用该对象存储点击的父评论
    },
    agreeChangeComments: {},
    childComments: {}
  },

  /**
   * 点击改变展示的是视频内容或评论内容
   */
  changeSelected(e) {
    this.setData({
      selected: e.target.dataset.index
    });
  },

  /**
   * 点击改变隐藏简介显示的状态
   */
  toggleHideIntro() {  
    let data = 'videoData.showVideoHiddenIntro';
    this.setData({
      [data]: this.data.videoData.showVideoHiddenIntro === '0'?'1':'0' 
    });
  },

  /**
   * 点击更换播放的集数
   */
  togglePlay(e) {
    let data = 'videoData.video.episodeNum';
    // this.setData({
    //   [data]: e.currentTarget.dataset.index   
    // });
    this.loadEpisode(e.currentTarget.dataset.index);
  },
  /**
   * 点击改变 全部集数的组件 的显示状态
   */
  toggleHideEpisode(e) {
    let data = 'videoData.showHideEpisode';
    this.setData({
      [data]: this.data.videoData.showHideEpisode === '0' ? '1' : '0' 
    });
  },
  /**
   * 点击改变 评论 的过滤条件
   */
  toggleCommentFilter(e) {
    let data = 'commentData.criteria';
    this.setData({
      [data]: e.currentTarget.dataset.index
    });
    this.loadFatherComments(REFRESH);
  },

  toggleModelInput() {
    let data = 'commentData.modelInput';
    this.setData({
      [data]: this.data.commentData.modelInput === '0'? '1':'0'
    });
    this.data.commentData.modelInput === '1' && (this.videoContext.pause());  //弹出评论模态框后暂停视频播放
  },

  /**
   * 获取用户输入的评论内容
   */
  enterComment(e) {
    let data = 'commentData.commentContent';
    this.setData({
      [data]: e.detail.value
    });
  },

  /**
   * 提交评论，此处将换行符统一替换为逗号再提交
   */
  commitComment() {
    let data = this.data.commentData.commentContent,
        parentId = '';
    data = utils.formatLine(data);
    data = utils.trim(data);
    if (this.data.commentData.modelChildComment === '1') {  // 表示是在父评论下评论
      parentId = commentStore.dispatch('getParentId') || '';
    }
    if(data !== ''){
      let commentInfo = {
        commentContent: data,     // 评论内容
        userId: 1,               // 用户id
        parentId: parentId,
        episodeId: this.data.videoData.video.episodeId      // 视频id
      }  
      $.post({
        url: 'https://www.yanda123.com/yanda/comment/saveComment',
        data: commentInfo
      }).then((res)=> {
        if(res.data.status === 200) {
          this.toggleModelInput();
          if(parentId) {
            this.loadChildComments(parentId, REFRESH);  
          }
          this.loadFatherComments(REFRESH);   // 评论完刷新数据
        }
      }).catch((err)=> {
        console.log(err);
      });
    } else {
      wx.showToast({
        title: '请输入评论内容',
        icon: 'none',
        mask: true,
        complete: () => {
          setTimeout(function () {
            wx.hideToast();
          }, 1000)
        }
      });
    }
  },

  
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 初始化从页面传递过来的视频id
    this.setData({
      mvId: options.id || 1
    });
    this.loadMovie(this.data.mvId);
    this.loadFatherComments(REFRESH)
  },

  /**
   * 加载父评论数据
   * @param refresh: 代表是否刷新评论 '1' 代表刷新，其他代表加载更多
   */
  loadFatherComments(refresh) {
    commentStore.dispatch('loadFatherComments', 
      { episodeId: 1, criteria: this.data.commentData.criteria, refresh: refresh })
      .then((res) => {
        if(res.status === 200) {
          this.setData({
            [_commentList]: res.data.commentList,
            [_canLoadMore]: res.data.canLoadMore
          });
        } else if(res.status === 100 && this.data.commentData.canLoadMore === '1') {
          this.setData({
            [_canLoadMore]: res.data.canLoadMore
          });  
        }
      }).catch((err) => {
        console.log(err);
      });
  },

  /**
   * 首次进入视频播放页，先获取视频信息：视频集数
   */
  loadMovie(mvId) {
    $.get({
      url: 'https://www.yanda123.com/yanda/movie/' + mvId
    }).then((res) => {
      if (res.data) {
        this.setData({
          episodeCount: res.data.episodeCount
        });
        this.loadEpisode(1);
      }
    }).catch((err) => {
      console.log(err);
    });
  },

  /**
   * 点击不同集数获取对应的视频集信息
   */
  loadEpisode(episodeNum) {
    $.get({
      url: 'https://www.yanda123.com/yanda/episode/getEpisode',
      data: {
        mvId: this.data.mvId,
        episodeNum: episodeNum || 1
      }
    }).then((res) => {
      let episodeInfo = res.data;
      if (episodeInfo) {
        episodeInfo.mvSrc = 'https://www.yanda123.com/yanda/attach/readFile?id=' + episodeInfo.mvAppendixId;
        episodeInfo.imgSrc = 'https://www.yanda123.com/yanda/attach/readFile?size=800&id=' + episodeInfo.imgAppendixId;
        this.setData({
          [_video]: episodeInfo
        });
      }
    }).catch((err) => {
      console.log(err);
    });
  },
  
  toggleModelChild(e) {
  	let index = e.currentTarget.dataset.index,
  		mcd = this.data.commentData.modelChildComment,
  		_mcd = 'commentData.modelChildComment',
  		_pc = 'commentData.parentComment';
    if(index !== undefined) {
      let pc = this.data.commentData.commentList[index];
      this.setData({ [_pc]: pc });
      this.loadChildComments(pc.commentId);
    } 
  	this.setData({
		  [_mcd]: mcd === '1'? '0':'1'
	  });
  },

  /**
   * 加载子评论事件
   */
  loadChildComments(parentId, refresh) {
    commentStore.dispatch('loadChildComments', {
      parentId: parentId,
      refresh: refresh,
      episodeId: this.data.videoData.video.episodeId
    }).then((res)=> {
      if(res.status === 200) {
        this.setData({
          childComments: res.data.childComments
        });  
      }
    }).catch((err)=> {
      console.log(err);
    })
  },

  /**
   * 点赞事件，子组件触发
   */
  agreeChange(e) {
    let index = e.currentTarget.dataset.index,      // 获取点赞的评论在 commentList 的下标
        agree = e.detail.agree,                        
        commentId = e.detail.commentId,
        comment = this.data.commentData.commentList[index],   // 获取点赞或取消点赞的评论
        agreeChangeComments = this.data.agreeChangeComments;
    if (comment.commentId === commentId && comment.agreeCount !== agree) {
      agreeChangeComments[commentId] = agree;         //如果点赞增加则要记录
    } else {
      agreeChangeComments[commentId] && delete agreeChangeComments[commentId];  //如果取消点赞则删除记录
    }   
    this.setData({
      agreeChangeComments: agreeChangeComments
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    this.videoContext = wx.createVideoContext('myVideo');   // 获取控制视频的对象，操作组件内 <video/> 组件
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
   * 客户离开页面时先判断客户有没有点赞，若有点赞再统一请求点赞接口
   */
  onUnload: function () {
    console.log('unload');
    // let agreeChangeComments = this.data.agreeChangeComments;
    // if(JSON.stringify(agreeChangeComments) !== '{}') {
    //   agreeChangeComments.userId = 1;     // 暂时写上，user功能完善从user获取
    //   $.post({
    //     url: 'https://www.yanda123.com/yanda/comment/addAgreeCount',
    //     data: agreeChangeComments
    //   }).then((res)=>{

    //   }).catch((err)=>{
    //     console.log(err);
    //   })   
    // }  
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
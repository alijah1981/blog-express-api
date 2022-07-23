const {Router} = require('express')
const router = Router()

const User = require('../models/User')
const Post = require('../models/Post')

const bcrypt = require("bcryptjs")
const jwt = require('jsonwebtoken')
const { TokenExpiredError } = jwt
const config = require('config')

router.post('/signup', async (req, res) => {
  try {

    if (!req.body.userId || !req.body.password) {
      return res.status(401).json({
        message: 'Пустое имя пользователя или пароль.'
      })
    }

    // валидация дубликата userId
    const utest = await User.findOne({
      where: {
        userId: req.body.userId
      }
    })

    if (utest) {
      return res.status(400).json({
        message: `${req.body.userId} уже используется.`
      })
    }

    const hashPassword = await bcrypt.hash(req.body.password, 8)

    const user = await User.create({
      userId: req.body.userId,
      password: hashPassword
    })

    res.status(201).json({
      message: `Зарегистрирован новый пользователь ${user.userId}.`
    })
  } catch (e) {
    console.log(e)
  }
})


router.post('/signin', async (req, res) => {
  try {

    if (req.body.userId !== undefined) {
      const user = await User.findOne({
        where: {
          userId: req.body.userId
        }
      })

      if (!user) {
        return res.status(401).json({ message: `Пользователь ${req.body.userId} не существует.` })
      }

      const areSame = await bcrypt.compare(req.body.password, user.password)

      if (!areSame) {
        return res.status(403).json({
          message: 'Неправильный пароль.'
        })
      }

      user.loggedIn = true

      await user.save()

      jwt.sign({userId: user.userId}, config.get('jwtsecret'), {
        expiresIn: config.get('jwtExpiration')
      }, (err, token) => {
        res.json({
          message: `Добро пожаловать, ${user.userId}`,
          jwt: token
        })
      })
    } else {
      return res.status(401).json({ message: 'Отсутствует поле login.' })
    }
  } catch (e) {
    console.log(e)
  }
})

router.get('/logout', verifyToken, async (req,res) => {
  try {
    const user = await User.findOne({
      where: { userId: req.userId }
    })

    user.loggedIn = false
    await user.save()

    res.json({ message: `Пользователь ${req.userId} вышел.` })

  } catch (e) {
    console.log(e)
  }
})



router.post('/new', verifyToken, async (req,res) => {

  if (req.body.postType === '' || req.body.title === '' || req.body.content === '' || !req.body.postType || !req.body.title || !req.body.content) {
    return res.status(404).json({ message: 'Невозможно создать запись - не все поля заполнены.' })
  }

  // поле content может содержать текст, ссылку на изображение или ссылку на видео
  // на фронтенде в зависимости от типа postType будет отображаться соответствующее содержимое записи

  const post = await Post.create({
    postType: req.body.postType,
    title: req.body.title,
    content: req.body.content,
    userId: req.userId
  })

  res.json({
    message: `Запись создана.`,
    ...post.dataValues
  })

})


router.get('/list', verifyToken, async (req, res) => {
  try {
    const rows = await Post.findAll()

    if(!rows.length) {
      return res.status(404).json({ message: `Записей пока нет.` })
    }

    res.json(rows)
  } catch (e) {
    console.log(e)
  }
})

router.get('/view/:id', verifyToken, async (req, res) => {
  try {
    const post = await Post.findOne({
      where: {
        id: req.params.id
      }
    })

    if(!post) {
      return res.status(404).json({ message: `Не найдена запись с id (${req.params.id}).` })
    }

    res.json(post)
  } catch (e) {
    console.log(e)
  }
})

router.put('/update/:id', verifyToken, async (req, res) => {
  try {
    const post = await Post.findOne({
      where: {
        id: req.params.id
      }
    })

    if(!post) {
      return res.status(404).json({ message: `Не найдена запись с id (${req.params.id}).` })
    }

    if (req.userId === post.userId) {

      if (req.body.title === '' || req.body.content === '' || !req.body.title || !req.body.content) {
        return res.status(404).json({ message: `Невозможно обновить запись id ${post.id} - не все поля заполнены.` })
      }

      post.title = req.body.title
      post.content = req.body.content
      post.save()
      res.json(`Запись id ${post.id} обновлена.`)
    } else {
      return res.status(404).json({
        message: `Текущий пользователь ${req.userId} не является автором записи (${post.userId}).`
      })
    }
  } catch (e) {
    console.log(e)
  }
})


router.delete('/delete/:id', verifyToken, async (req, res) => {
  try {
    const post = await Post.findOne({
      where: {
        id: req.params.id
      }
    })

    if(!post) {
      return res.status(404).json({ message: `Не найдена запись с id (${req.params.id}).` })
    }

    if (req.userId === post.userId) {
      await Post.destroy({ where: { id: post.id } })
      res.json({ message: `Запись с id ${post.id} удалена.` })
    } else {
      return res.status(404).json({
        message: `Текущий пользователь ${req.userId} не является автором записи (${post.userId}).`
      })
    }

  } catch (e) {
    console.log(e)
  }
})


// token functions

function catchError(err, res) {
  if (err instanceof TokenExpiredError) {
    return res.status(401).json({ message: "Авторизация не пройдена. Истек токен." })
  }

  return res.status(401).json({ message: "Авторизация не пройдена." })
}

async function verifyToken (req, res, next) {
  const token = req.headers["x-access-token"]

  if (!token) {
    return res.status(403).json({
      message: "Отсутствует токен."
    })
  }

  jwt.verify(token, config.get('jwtsecret'), (err, decoded) => {
    if (err) {
      return catchError(err, res)
    }
    req.userId = decoded.userId
  })

  if (req.userId !== undefined) {
    const user = await User.findOne({
      where: { userId: req.userId }
    })

    if (!user.loggedIn) {
      return res.status(401).json({ message: "Авторизация не пройдена." })
    } else {
      next()
    }
  }
}

module.exports = router

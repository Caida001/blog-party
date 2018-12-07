//load app configuration
require('dotenv').config({ path: './variables.env' })
// simplify sirectory paths
const path = require('path')
// read and write from files
const fs = require('fs')
//logging
const morgan = require('morgan')
// framework for building web apps with node
const express = require('express')
// generate unique ids for json file
const uuid = require('uuid/v1')
// parse HTML forms
const bodyParser = require('body-parser')
// HTML forms PUT & DELETE
const methodOverride = require('method-override')
// MongoDB ORM
const mongoose = require('mongoose')

// connect to hosted database
mongoose.connect('mongodb://localhost:27017/app')

const db = mongoose.connection
db.on('error', err => console.error(err))
// create schema and model once connected
let Blog, blogSchema
db.once('open', () => {
  blogSchema = new mongoose.Schema({
    author: String,
    title: String,
    body: String,
    updatedAt: Date,
    createdAt: Date
  })
  Blog = mongoose.model('Blog', blogSchema)
})

// make the app
const app = express()

app.set('views', 'views')
app.set('view engine', 'pug')

// create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false })

// logging
app.use(morgan('combined'))
// serving static files
app.use(express.static(path.join(__dirname, 'styles')))
// PUT & DELETE for forms
app.use(methodOverride('_method'))

// middleware example
const colors = [
  'red',
  'blue',
  'green',
  'yellow',
  'purple',
  'orange',
  'pink',
  'teal'
]
const sampleColor = () => {
  const randomIdx = Math.floor(Math.random() * colors.length)
  return colors[randomIdx]
}
const addColorToReq = (req, res, next) => {
  if(req.colors instanceof Array) {
    req.colors.push(sampleColor())
  } else {
    req.colors = [sampleColor()]
  }
  next()
}

app.get(
  '/three-colors',
  addColorToReq,
  addColorToReq,
  addColorToReq,
  (req, res) => {
    res.end(req.colors.join(', '))
  }
)

// index view
app.get('/', (req, res) => {
  // synchronous method to read in the file. Bad, we'll replace...
  // const blogArray = JSON.parse(fs.readFileSync('./seeds/blogs.json', 'utf-8'))
  Blog.find((err, blogCollection) => {
    if(err) {
      res.status(404).end('something went wrong')
    } else {
      res.render('index', { blogs: blogCollection })
    }
  })
})

// new view
app.get('/new', (req, res) => {
  res.render('new')
})

// show view
app.get('/:blogId', (req, res) => {
  const blogId = req.params.blogId
  Blog.findById(blogId, (err, blog) => {
    if(err) {
      res.status(404).end('Blog not found')
    } else {
      res.render('show', { blog })
    }
  })
})

// edit view
app.get(`/:blogId/edit`, (req, res) => {
  const blogId = req.params.blogId
  Blog.findById(blogId, (err, blog) => {
    if(err) {
      res.status(404).end('Blog not found')
    } else {
      res.render('edit', { blog })
    }
  })
})

// Delete action
app.delete('/:blogId', (req, res) => {
  const blogId = req.params.blogId
  Blog.deleteOne({_id: blogId }, () => {
    res.redirect(303, '/')
  })
})

// update action
app.put('/:blogId', urlencodedParser, (req, res) => {
  const blogId = req.params.blogId
  const { author, title, blog_body: body } = req.body
  Blog.findByIdAndUpdate(
    blogId,
    { author, title, body, updatedAt: Date.now() },
    err => {
      if(err) {
        res.status(404).end('Blog not found')
      } else {
        res.redirect(303, '/')
      }
    }
  )
})

// create action
app.post('/', urlencodedParser, (req, res) => {
  Blog.create(
    {
      author: req.body.author || 'anon',
      title: req.body.title || 'blog title',
      body: req.body.blog_body || 'blog body',
      updatedAt: Date.now(),
      createdAt: Date.now()
    },
    (err, blog) => {
      if(err) {
        res.status(404).end('something went wrong')
      } else {
        res.redirect(303, '/')
      }
    }
  )
})

app.listen(process.env.PORT, () => console.log(`listening on ${process.env.PORT}`))

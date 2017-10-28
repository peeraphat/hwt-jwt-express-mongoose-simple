const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const morgan = require('morgan')
const mongoose = require('mongoose')

const jwt = require('jsonwebtoken')
const config = require('./config')
const User = require('./app/models/user')

const port = 8080
mongoose.connect(config.database)
app.set('superSecret', config.secret)

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(morgan('dev'))

const apiRoutes = express.Router()
apiRoutes.use(function(req, res, next) {
    var token = req.body.token || req.query.token || req.headers['x-access-token']
    if(token) {
        jwt.verify(token, app.get('superSecret'), function(err, decoded){
            if(err) {
                return res.json({ success: false, message: 'Failed to authenticate token.'})
            } else {
                req.decoded = decoded
                next()
            }
        })
    } else {
        return res.status(403).send({
            success: false,
            message: 'No token provided'
        })
    }
})
apiRoutes.get('/', function(req, res) {
    res.json({ message: 'Welcome to the coolest API on earth!'})
})

apiRoutes.get('/users', function(req, res) {
    User.find({}, function(err, users) {
        res.json(users)
    })
})

apiRoutes.post('/authenticate', function(req, res) {
    User.findOne({
        name: req.body.name
    }, function(err, user) {
        if(err) throw err

        if(!user){
            res.json({ success: false, message: 'Authentication failed. User not found.'})
        } else if (user) {
            if (user.password != req.body.password) {
                res.json({ success: false, message: 'Authentication failed. Wrong password.'})
            } else {
                const payload = { admin: user.admin }
                const token = jwt.sign(payload, app.get('superSecret'), {
                    expiresIn: 1440
                })
                res.json({
                    success: true,
                    message: 'Enjoy your token!',
                    token: token
                })
            }
        }
    })
})

app.use('/api', apiRoutes)
/* app.get('/', function(req, res) {
    res.send('Hello! The API is http://localhost:'+ port + '/api')
})


app.get('/setup', function(req, res) {
    var kevin = new User({
        name: 'Kevin Pee',
        password: '1234',
        admin: true
    })

    kevin.save(function(err) {
        if(err) throw err
        console.log('User saved successfully')
        res.json({ success: true })
    })
}) */

app.listen(port, function(){
    console.log('Magic happens at https//localhost:'+port)
})
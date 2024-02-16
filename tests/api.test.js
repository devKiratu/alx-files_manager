import request from 'request';
import { expect } from 'chai';
import { before, describe, it } from 'mocha';

describe( 'api endpoints tests', () => {
  const baseUrl = 'http://localhost:5000';
  const generateRandomStr = () => Math.random().toString( 36 ).substring( 2, 10 );
  let user;
  let email;
  let password;

  before( () => {
    email = `${ generateRandomStr() }@gmail.com`;
    password = generateRandomStr()
    const userDetails = {
      email,
      password
    }
    request( {
      method: 'POST',
      url: `${ baseUrl }/users`,
      json: true,
      body: userDetails
    }, ( err, res, body ) => {
      if ( !err ) {
        user = body;
      }
    } )
    
  })

  describe( 'GET /status', () => {
    it( 'should return status code 200 when server is running', ( done ) => {
      request( `${ baseUrl }/status`, (err, res, body) => {
        expect( res.statusCode ).to.equal( 200 )
        done()
      } )
    } )
    
    it( 'should return correct status payload', ( done ) => {
      request( `${ baseUrl }/status`, ( err, res, body ) => {
        expect( JSON.parse( res.body ) ).to.deep.equal( { "redis": true, "db": true } );
        done()
      } )
    } )
  } );

  describe( 'GET /stats', () => {
    it( 'should return the right status code when server is running', ( done ) => {
      request( `${ baseUrl }/stats`, ( err, res, body ) => {
        expect( res.statusCode ).to.equal( 200 );
        done()
      } )
    } );

    it( 'should contain "users" and "files" stats in the response', ( done ) => {
      request( `${ baseUrl }/stats`, ( err, res, body ) => {
        const data = JSON.parse( res.body );
        expect( data.files ).to.exist;
        expect( data.users ).to.exist;
        done()
      })
    })
  } )
  
  describe( 'POST /users', () => {
    it('should return correct statusCode on successful user creation', (done) => {
      const userDetails = {
        email: `${generateRandomStr()}@gmail.com`,
        password: '123456'
      }
      request( {
        method: 'POST',
        url: `${ baseUrl }/users`,
        json: true,
        body: userDetails
      }, ( err, res, body ) => {
        expect( res.statusCode ).to.equal( 201 );
        done();
      } )
    })
    it('should return correct user payload on successful user creation', (done) => {
        const userDetails = {
        email: `${generateRandomStr()}@gmail.com`,
        password: '123456',
      }
      request( {
        method: 'POST',
        url: `${ baseUrl }/users`,
        json: true,
        body: userDetails
      }, ( err, res, body ) => {
        expect(body).to.include.keys(['id', 'email'])
        done();
      } )
    })
    it('should return error "Missing email" if email is missing', (done) => {
        const userDetails = {
        password: '123456',
      }
      request( {
        method: 'POST',
        url: `${ baseUrl }/users`,
        json: true,
        body: userDetails
      }, ( err, res, body ) => {
        expect(res.statusCode).to.equal(400)
        expect(body).to.deep.equal({ error: 'Missing email' })
        done();
      } )

    })
    it('should return error "Missing password" if password is missing', (done) => {
      const userDetails = {
        email: `${generateRandomStr()}@gmail.com`,
      }
      request( {
        method: 'POST',
        url: `${ baseUrl }/users`,
        json: true,
        body: userDetails
      }, ( err, res, body ) => {
        expect(res.statusCode).to.equal(400)
        expect(body).to.deep.equal({ error: 'Missing password' })
        done();
      } )

    })
  })
  describe( 'GET /connect', () => {
    it( 'should return error for unregistered user', ( done ) => {
      const dummyUser = `${ generateRandomStr() }@gmail.com:12345`;
      const encodedStr = Buffer.from( dummyUser ).toString( 'base64' );
      request( `${ baseUrl }/connect`, { headers: { 'Authorization': `Basic ${ encodedStr }` } }, ( err, res, body ) => {
        expect( res.statusCode ).to.equal( 401 )
        expect(JSON.parse(body)).to.deep.equal({error:"Unauthorized"})
        done();
      })
    } )
    it( 'should return token for registered user', ( done ) => {
      const registeredUser = `${email}:${password}`;
      const encodedStr = Buffer.from( registeredUser ).toString( 'base64' );
      request( `${ baseUrl }/connect`, { headers: { 'Authorization': `Basic ${ encodedStr }` } }, ( err, res, body ) => {
        expect( res.statusCode ).to.equal( 200 )
        expect( JSON.parse( body ) ).to.include.keys( [ 'token' ] );
        done();
      })
    })
  })
  describe('GET /disconnect', () =>{})
  describe('GET /users/me', () =>{})
  describe('POST /files', () =>{})
  describe('GET /files/:id', () =>{})
  describe('GET /files', () =>{})//pagination
  describe('PUT /files/:id/publish', () =>{})
  describe('PUT /files/:id/unpublish', () =>{})
  describe('GET /files/:id/data', () =>{})
})

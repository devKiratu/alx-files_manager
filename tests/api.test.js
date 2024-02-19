import request from 'request';
import { expect } from 'chai';
import { before, describe, it } from 'mocha';

describe( 'api endpoints tests', () => {
  const baseUrl = 'http://localhost:5000';
  const generateRandomStr = () => Math.random().toString( 36 ).substring( 2, 10 );
  let user;
  let email;
  let password;
  let token;

  before( (done) => {
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
      done()
    } );
    
  } )

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
  } )
  
  describe( 'GET /disconnect', () => {
    before( ( done ) => {
      //log in user
      const registeredUser = `${ email }:${ password }`;
      const encodedStr = Buffer.from( registeredUser ).toString( 'base64' );
      request( `${ baseUrl }/connect`,
        { headers: { 'Authorization': `Basic ${ encodedStr }` } },
        ( err, res, body ) => {
          if ( !err ) {
            token = JSON.parse( body );
          }
          done()
        } )
    } );

    it( 'should return error for unregistered user', ( done ) => {
      request( `${ baseUrl }/disconnect`,
        { headers: { 'X-Token': 'dummy-token' } },
        ( err, res, body ) => {
          expect( res.statusCode ).to.equal( 401 )
          expect( JSON.parse( body ) ).to.deep.equal( { error: "Unauthorized" } )
          done();
        } )
    } );

    it( 'should return correct status code on successful disconnect', ( done ) => {
      request( `${ baseUrl }/disconnect`,
        { headers: { 'X-Token': `${ token.token }` } },
        ( err, res, body ) => {
          expect( res.statusCode ).to.equal( 204 )
          done();
        } );
    } );
  } )
  
  describe( 'GET /users/me', () => {
    before( ( done ) => {
      //log in user
      const registeredUser = `${ email }:${ password }`;
      const encodedStr = Buffer.from( registeredUser ).toString( 'base64' );
      request( `${ baseUrl }/connect`,
        { headers: { 'Authorization': `Basic ${ encodedStr }` } },
        ( err, res, body ) => {
          if ( !err ) {
            token = JSON.parse( body );
          }
          done()
        } )
    } );

    it( 'should return error when wrong token is used', ( done ) => {
      request( `${ baseUrl }/users/me`,
        { headers: { 'X-Token': 'dummy-token' } },
        ( err, res, body ) => {
          expect( res.statusCode ).to.equal( 401 )
          expect( JSON.parse( body ) ).to.deep.equal( { error: "Unauthorized" } )
          done();
        } )
    } );

    it( 'should return user payload for valid token', ( done ) => {
      request( `${ baseUrl }/users/me`,
        { headers: { 'X-Token': `${ token.token }` } },
        ( err, res, body ) => {
          expect( res.statusCode ).to.equal( 200 )
          expect( JSON.parse( body ) ).to.include.keys( [ 'id', 'email' ] )
          expect( JSON.parse( body ).email ).to.equal( email )
          done();
        } );
    } );  
  } )
  
  describe( 'POST /files', () => {
    before( ( done ) => {
      //log in user
      const registeredUser = `${ email }:${ password }`;
      const encodedStr = Buffer.from( registeredUser ).toString( 'base64' );
      request( `${ baseUrl }/connect`,
        { headers: { 'Authorization': `Basic ${ encodedStr }` } },
        ( err, res, body ) => {
          if ( !err ) {
            token = JSON.parse( body );
          }
          done()
        } )
    } );

    it( 'should reject an upload from an unauthorized user', ( done ) => {
      const fileDetails = { name: "myText.txt", type: "file", data: "SGVsbG8gV2Vic3RhY2shCg==" }
      request( {
        method: 'POST',
        url: `${ baseUrl }/files`,
        headers: {
          'X-Token': 'dummy token',
        },
        json: true,
        body: fileDetails
      }, ( err, res, body ) => {
        expect(res.statusCode).to.equal(401)
        expect(body).to.deep.equal({ error: 'Unauthorized' })
        done();
      } )      
    })
    it( 'should return error: "Missing name" if file name is missing', ( done ) => {
      const fileDetails = { naming: "myText.txt", type: "file", data: "SGVsbG8gV2Vic3RhY2shCg==" }
      request( {
        method: 'POST',
        url: `${ baseUrl }/files`,
        headers: {
          'X-Token': `${token.token}`,
        },
        json: true,
        body: fileDetails
      }, ( err, res, body ) => {
        expect(res.statusCode).to.equal(400)
        expect(body).to.deep.equal({ error: 'Missing name' })
        done();
      } )      
    } )

    it( 'should return error "Missing type" if file type is not one of (image, file, folder)', ( done ) => {
      const fileDetails = { name: "myText.txt", type: "", data: "SGVsbG8gV2Vic3RhY2shCg==" }
      request( {
        method: 'POST',
        url: `${ baseUrl }/files`,
        headers: {
          'X-Token': `${token.token}`,
        },
        json: true,
        body: fileDetails
      }, ( err, res, body ) => {
        expect(res.statusCode).to.equal(400)
        expect(body).to.deep.equal({ error: 'Missing type' })
        done();
      } )      
    } )

    it( 'should return error "Missing data" if data is not present and type is not folder', ( done ) => {
      const fileDetails = { name: "myText.txt", type: "file", }
      request( {
        method: 'POST',
        url: `${ baseUrl }/files`,
        headers: {
          'X-Token': `${ token.token }`,
        },
        json: true,
        body: fileDetails
      }, ( err, res, body ) => {
        expect( res.statusCode ).to.equal( 400 )
        expect( body ).to.deep.equal( { error: 'Missing data' } )
        done();
      } );
    } );

    it( 'should return a file payload on successful file upload', ( done ) => {
      const fileDetails = { name: "myText.txt", type: "file", data: "SGVsbG8gV2Vic3RhY2shCg=="}
      request( {
        method: 'POST',
        url: `${ baseUrl }/files`,
        headers: {
          'X-Token': `${ token.token }`,
        },
        json: true,
        body: fileDetails
      }, ( err, res, body ) => {
        expect( res.statusCode ).to.equal( 201 )
        expect( body ).to.include.keys(['id', 'userId', 'name', 'type', 'isPublic', 'parentId'])
        done();
      } );      
    })

  } );

  describe( 'GET /files/:id', () => {
    let fileId;
    before( ( done ) => {
      const fileDetails = { name: "myText.txt", type: "file", data: "SGVsbG8gV2Vic3RhY2shCg=="}
      request( {
        method: 'POST',
        url: `${ baseUrl }/files`,
        headers: {
          'X-Token': `${ token.token }`,
        },
        json: true,
        body: fileDetails
      }, ( err, res, body ) => {
        if ( !err ) {
          fileId = body.id
        }
        done();
      } );   
    })

    it( 'should return error if invalid token is used', ( done ) => {
      request( `${ baseUrl }/files/${ fileId }`,
        { headers: { 'X-Token': 'dummy-token' } },
        ( err, res, body ) => {
          expect( res.statusCode ).to.equal( 401 )
          expect( JSON.parse( body ) ).to.deep.equal( { error: "Unauthorized" } )
          done();
        } );
    } );

    it( 'should return error Not Found if fileId is not valid', ( done ) => {
      request( `${ baseUrl }/files/123456789123`,
        { headers: { 'X-Token': `${ token.token }` } },
        ( err, res, body ) => {
          expect( res.statusCode ).to.equal( 404 )
          expect( JSON.parse( body ) ).to.deep.equal( { error: 'Not found' } )
          done();
        } );
    } );

    it( 'should return file payload for valid token and fileId', (done) => {
      request( `${ baseUrl }/files/${fileId}`,
        { headers: { 'X-Token': `${ token.token }` } },
        ( err, res, body ) => {
          expect( res.statusCode ).to.equal( 200 )
          expect( JSON.parse(body) ).to.include.keys(['id', 'userId', 'name', 'type', 'isPublic', 'parentId'])
          done();
        } );      
    })
  } )
  
  describe( 'GET /files', () => {
    it( 'should return error if invalid token is used', ( done ) => {
      request( `${ baseUrl }/files`,
        { headers: { 'X-Token': 'dummy-token' } },
        ( err, res, body ) => {
          expect( res.statusCode ).to.equal( 401 )
          expect( JSON.parse( body ) ).to.deep.equal( { error: "Unauthorized" } )
          done();
        } );    
    } );

    it( 'should return an array of files when valid token is used', ( done ) => {
      request( `${ baseUrl }/files`,
        { headers: { 'X-Token': `${token.token}`} },
        ( err, res, body ) => {
          expect( res.statusCode ).to.equal( 200 );
          expect(JSON.parse(body)).to.be.an.instanceOf(Array)
          done();
        } );      
    })
  } )
  
  describe( 'PUT /files/:id/publish', () => {
    let fileId;
    before( ( done ) => {
      const fileDetails = { name: "myText.txt", type: "file", data: "SGVsbG8gV2Vic3RhY2shCg=="}
      request( {
        method: 'POST',
        url: `${ baseUrl }/files`,
        headers: {
          'X-Token': `${ token.token }`,
        },
        json: true,
        body: fileDetails
      }, ( err, res, body ) => {
        if ( !err ) {
          fileId = body.id
        }
        done();
      } );   
    })

    it( 'should return error if invalid token is used', ( done ) => {
      request( {
        method: 'PUT',
        url: `${ baseUrl }/files/${fileId}/publish`,
        headers: {
          'X-Token': `dummy token`,
        },
      }, ( err, res, body ) => {
        expect( res.statusCode ).to.equal( 401 )
        expect( JSON.parse( body ) ).to.deep.equal( { error: "Unauthorized" } )
        done();  
      } ); 
    } );

    it( 'should return error Not Found if fileId is not valid', ( done ) => {
      request( {
        method: 'PUT',
        url: `${ baseUrl }/files/${fileId}dummy/publish`,
        headers: {
          'X-Token': `${token.token}`,
        },
      }, ( err, res, body ) => {
        expect( res.statusCode ).to.equal( 404 )
        expect( JSON.parse( body ) ).to.deep.equal( { error: 'Not found' } )
        done();  
      } ); 
    } );

    it( 'should set file attribute "isPublic" to true', ( done ) => {
      request( {
        method: 'PUT',
        url: `${ baseUrl }/files/${fileId}/publish`,
        headers: {
          'X-Token': `${token.token}`,
        },
      }, ( err, res, body ) => {
        expect( res.statusCode ).to.equal( 200 )
        expect(JSON.parse(body).isPublic).to.be.true
        done();  
      } ); 
    } );
  } );
  
  describe( 'PUT /files/:id/unpublish', () => {
    let fileId;
    before( ( done ) => {
      const fileDetails = { name: "myText.txt", type: "file", data: "SGVsbG8gV2Vic3RhY2shCg==", isPublic: true }
      request( {
        method: 'POST',
        url: `${ baseUrl }/files`,
        headers: {
          'X-Token': `${ token.token }`,
        },
        json: true,
        body: fileDetails
      }, ( err, res, body ) => {
        if ( !err ) {
          fileId = body.id
        }
        done();
      } );
    } );

    it( 'should return error if invalid token is used', ( done ) => {
      request( {
        method: 'PUT',
        url: `${ baseUrl }/files/${fileId}/unpublish`,
        headers: {
          'X-Token': `dummy token`,
        },
      }, ( err, res, body ) => {
        expect( res.statusCode ).to.equal( 401 )
        expect( JSON.parse( body ) ).to.deep.equal( { error: "Unauthorized" } )
        done();  
      } ); 
    } );

    it( 'should return error Not Found if fileId is not valid', ( done ) => {
      request( {
        method: 'PUT',
        url: `${ baseUrl }/files/${fileId}dummy/unpublish`,
        headers: {
          'X-Token': `${token.token}`,
        },
      }, ( err, res, body ) => {
        expect( res.statusCode ).to.equal( 404 )
        expect( JSON.parse( body ) ).to.deep.equal( { error: 'Not found' } )
        done();  
      } ); 
    } );

    it( 'should set file attribute "isPublic" to false', ( done ) => {
      request( {
        method: 'PUT',
        url: `${ baseUrl }/files/${fileId}/unpublish`,
        headers: {
          'X-Token': `${token.token}`,
        },
      }, ( err, res, body ) => {
        expect( res.statusCode ).to.equal( 200 )
        expect(JSON.parse(body).isPublic).to.be.false
        done();  
      } ); 
    } );

  } )
  
  describe( 'GET /files/:id/data', () => {
    let fileId;
    const data = "Hello from api tests!"
    const fileData = Buffer.from( data ).toString( 'base64' );
    before( ( done ) => {
      const fileDetails = { name: "myText.txt", type: "file", data: fileData, isPublic: true }
      request( {
        method: 'POST',
        url: `${ baseUrl }/files`,
        headers: {
          'X-Token': `${ token.token }`,
        },
        json: true,
        body: fileDetails
      }, ( err, res, body ) => {
        if ( !err ) {
          fileId = body.id
        }
        done();
      } );
    } );
    
    it( 'should return error Not Found if fileId is invalid', ( done ) => {
      request( `${ baseUrl }/files/${ fileId }dummy/data`,
        { headers: { 'X-Token': `${ token.token }` } },
        ( err, res, body ) => {
          expect( res.statusCode ).to.equal( 404 )
          expect( JSON.parse( body ) ).to.deep.equal( { error: 'Not found' } )
          done();
        } );
    } );

    it( 'should return file content for a valid fileId of a published file', ( done ) => {
      request( `${ baseUrl }/files/${ fileId }/data`,
        ( err, res, body ) => {
          expect( res.statusCode ).to.equal( 200 )
          expect(body).to.equal(data)
          done();
        } );
    })

  })
})

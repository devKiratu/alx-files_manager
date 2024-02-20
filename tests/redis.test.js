import { before, describe, it } from 'mocha';
import redisClient from '../utils/redis';
import { expect } from 'chai';

describe( 'redisClient tests', () => {
  describe( 'redisClient.get', () => {
    let key = 'test_key';
    let value = 'test_value';
    before( ( done ) => {
      redisClient.set( key, value, 36000 ).then( ( result ) => {
        done()
      } );
    } );

    it( 'should return null for an invalid key', ( done ) => {
      redisClient.get( 'invalid_key' ).then( ( result ) => {
        expect( result ).to.be.null
        done()
      } )
    } );

    it( 'should return expected value for valid key', ( done ) => {
      redisClient.get( key ).then( ( result ) => {
        expect( result ).to.equal( value );
        done();
      } )
    } )
  } );

  describe( 'redisClient.set', () => {
    let key = 'test_key';
    let value = 'test_value';
    before( ( done ) => {
      redisClient.set( key, value, 36000 ).then( ( result ) => {
        done()
      } );
    } );

    it( 'should set a value for the given key', ( done ) => {
        redisClient.get( key ).then( ( result ) => {
        expect( result ).to.equal( value );
        done();
      } )
    } )

  } )
  
  describe( 'Expiry for set key value pair', () => {
    const expKey = 'test_key_to_expire';
    const expValue = 'test_value_to_expire';
    const expiryTime = 1
    before( ( done ) => {
      redisClient.set( expKey, expValue, expiryTime).then( ( result ) => {
        done()
      } );
    } );

    
    it( 'should expiry time countdown works as expected', ( done ) => {
      redisClient.get( expKey ).then( ( result ) => {
        expect( result ).to.equal( expValue );
        done();
      } )
    } )
    
    it( 'key does not exist after expiry time', ( done ) => {
      setTimeout( () => {
        redisClient.get( expKey ).then( ( result ) => {
          expect( result ).to.be.null;
          done();
        })
      }, expiryTime * 1000)
    })
    
  } )
  
  describe( 'redisClient.del', () => {
    let key = 'test_key';
    let value = 'test_value';
    before( ( done ) => {
      redisClient.set( key, value, 36000 ).then( ( result ) => {
        done()
      } );
    } );

    it( 'key exists before redisClient.del is called', ( done ) => {
        redisClient.get( key ).then( ( result ) => {
        expect( result ).to.equal( value );
        done();
      } )
    } )
  } )
  
  describe( 'redisClient.del', () => {
    let key = 'test_key';
    before( ( done ) => {
      redisClient.del(key).then( ( result ) => {
        done()
      } );
    } );

    it( 'should return null for deleted key', (done) => {
      redisClient.get(key).then( ( result ) => {
        expect( result ).to.be.null
        done()
      } )      
    })
  })
})

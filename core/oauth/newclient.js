/* accepts 4 requests:
 * /(GET): displays a form for creating new client. Only admin client is able to use it
 * /(POST): posts the parameters as a form. a random secret is generated and returned
 * /(GET): If not from admin client, displays activation page with fields of id and activation code
 * /(POST): If not form admin client, receives id and activation code and returns new secret
 */
module.exports=function(req,res,next){
}

import { PersistentUnorderedMap, logging, context, u128, ContractPromiseBatch } from 'near-sdk-as'

const ONE_NEAR = u128.from('1000000000000000000000000');

//Creamos una clase llamada Propietario
@nearBindgen
class Propietario {
  cuenta: string;
  nombre: string;
  autoDisponible: bool; 
  precio: u32;

  //Inicializamos el objeto
  constructor(cuenta: string, nombre: string, autoDisponible: bool, precio: u32) {
    this.cuenta = cuenta;
    this.nombre = nombre;
    this.autoDisponible = autoDisponible;
    this.precio = precio;
  }
}

//Creamos una clase llamada Usuario
@nearBindgen
class Usuario {
  cuenta: string;
  nombre: string;
  autoRentado: bool;

  //Inicializamos el objeto
  constructor(cuenta: string, nombre: string, autoRentado: bool) {
    this.cuenta = cuenta;
    this.nombre = nombre;
    this.autoRentado = false;
  }
}

//Creamos dos colecciones para almacenar información en nuestro contrato.
export const propietarios = new PersistentUnorderedMap<string, Propietario>("p");
export const usuarios = new PersistentUnorderedMap<string, Usuario>("u");

//MÉTODOS DEL CONTRATO:

/**
 * Método de ESCRITURA para registrar un nuevo Propietario
 * El comando para utilizarlo en la terminal es:
 *  >> near call $CONTRATO setPropietario '{"nombre":"NOMBRE","autoDisponible":bool,"precio":u128}' --accountId cuenta.near --amount 1
 *    * $CONTRATO es una variable que contiene el id de la cuenta del contrato
 * 
 * @param nombre string que requiere el nombre del propietario a registrar
 * @param autoDisponible booleano que determina si el propietario tiene o no su auto disponible (para facilitar las cosas, se asume que cada propietario tiene sólo un auto) 
 * @param precio entero de 32 bits sin signo que requiere el precio a pagar que pide el propietario del auto
 * 
 * Es necesario enviarle 1 NEAR (o más) como pago a este método.
 */
export function setPropietario(nombre: string, autoDisponible: bool, precio: u32): void {

  //Usamos el context de la transacción para obtener datos de la misma.
  const cuenta = context.sender;
  const deposito = context.attachedDeposit;
  const precioInt = u128.mul(ONE_NEAR, u128.from(precio));
  //Hacemos validaciones. Queremos que:
  //* No pongan 0 como edad, osea que la edad sea mayor a 0.
  //* El nombre tenga más de 3 caractéres.
  //* Paguen 1 NEAR cada vez que se registren
  assert(nombre.length >= 3, "El nombre debe contener 3 o más caractéres.");
  assert(deposito >= ONE_NEAR, "Debes pagar 1 NEAR para registrarte.");
  assert(precioInt > ONE_NEAR, "El precio de renta debe ser mayor a 1 NEAR.");


  //Instanciamos la clase (creamos un objeto) y le mandamos los datos al constructor.
  let propietario = new Propietario (cuenta, nombre, autoDisponible, precio);

  //Guardamos la información en la blockchain.
  //PersistentUnorderedMap requiere una clave y el dato a guardar.
  //Para más información consulta: https://docs.near.org/docs/concepts/data-storage#persistentunorderedmap
  propietarios.set(cuenta, propietario);

  //Le enviamos un mensaje de confirmación a la consola.
  logging.log("Registro creado exitosamente.");
}

/**
 * Método de LECTURA que regresa un propietario
 * El comando para utilizarlo en la terminal es:
 *  >> near view $CONTRATO getPropietario '{"cuenta":"CUENTA.NEAR"}'
 * @param cuenta string que contiene la cuenta (key) del usuario a consultar
 * @returns Propietario
 */
export function getPropietario (cuenta: string): Propietario | null {
  return propietarios.get(cuenta);
}

/**
 * Método de LECTURA que regresa toda la lista de propietarios registrados
 * El comando para utilizarlo en la terminal es:
 *  >> near view $CONTRATO getPropietarios '{}'
 * @returns Propietario[] (Arreglo de propietarios)
 */
export function getPropietarios(): Propietario[] {
  return propietarios.values();
}

  // Métodos similares a los anteriores, pero para incorporar usuarios a la dapp.

export function setUsuario(nombre: string, autoRentado: bool): void {

  //Usamos el context de la transacción para obtener datos de la misma.
  const cuenta = context.sender;
  const deposito = context.attachedDeposit;

  //Hacemos validaciones. Queremos que:
  //* El nombre tenga más de 3 caractéres.
  //* Paguen 1 NEAR cada que se registren
  assert(nombre.length >= 3, "El nombre debe contener 3 o más caractéres.");
  assert(deposito >= ONE_NEAR, "Debes de pagar 1 NEAR para registrarte.");


  //Instanciamos la clase (creamos un objeto) y le mandamos los datos al constructor.
  let usuario = new Usuario (cuenta, nombre, autoRentado);

  //Guardamos la información en la blockchain.
  //PersistentUnorderedMap requiere una clave y el dato a guardar.
  //Para más información consulta: https://docs.near.org/docs/concepts/data-storage#persistentunorderedmap
  usuarios.set(cuenta, usuario);

  //Le enviamos un mensaje de confirmación a la consola.
  logging.log("Registro creado exitosamente.");
}

/**
 * Método de LECTURA que regresa un usuario
 * El comando para utilizarlo en la terminal es:
 *  >> near view $CONTRATO getUsuario '{"cuenta":"CUENTA.NEAR"}'
 * @param cuenta string que contiene la cuenta (key) del usuario a consultar
 * @returns Usuario
 */
export function getUsuario (cuenta: string): Usuario | null {
  return usuarios.get(cuenta);
}

/**
 * Método de LECTURA que regresa toda la lista de usuarios registrados
 * El comando para utilizarlo en la terminal es:
 *  >> near view $CONTRATO getUsuarios '{}'
 * @returns Usuario[] (Array de usuarios)
 */
export function getUsuarios(): Usuario[] {
  return usuarios.values();
}

/*  Método de ESCRITURA que permite a un Usuario rentar el auto propiedad del Propietario a cambio
 *  del pago del precio estipulado previamente por él.
    Este método modifica la propiedad booleana autoDisponible en la instanciación de Propietario y, a la vez, modifica la propiedad
    booleana autoRentado en la instanciación de Usuario.
    Asimismo, este método recibe el pago en Near por parte del usuario de lo estipulado en la propiedad precio 
    del Propietario y luego transfiere ese monto desde el contrato al Propietario. 

  * @param cuentaPropietario string que contiene la cuenta (key) del propietario del auto a ser rentado.
  */
    

export function rentarAuto(cuentaPropietario: string): void {
  
  //Validamos que tanto el usuario que llama la función como el propietario ingresado como parámetro se encuentren registrados.
  assert(usuarios.contains(context.sender), "Tienes que ser un usuario registrado para ejecutar este comando.");
  assert(propietarios.contains(cuentaPropietario), "Tienes que ingresar la cuenta de un propietario registrado para ejecutar este comando.");
  
  //Alojamos en variables los valores de las instanciaciones de usuario y propietario, haciendo uso, respectivamente del context y 
  //del parámetro ingresado por quien llama la función.
  const cuenta = usuarios.get(context.sender);
  const propietario = propietarios.get(cuentaPropietario);

  //Alojamos en una constante el valor depositado al llamar la función.
  const deposito = context.attachedDeposit;
  
  //Declaramos la variable precioAuto y, luego de chequear que el propietario tenga su auto disponible, le asignamos el valor de
  // la propiedad precio a precioAuto.
  var precioAuto: u32 = 0;
  if(propietario) {
    assert(propietario.autoDisponible, "El propietario no tiene su auto disponible.");
    precioAuto = propietario.precio;
  }

  //Validamos si el depósito es equivalente al precio estipulado por el propietario. Para hacer la comparación, convertimos precioAuto a u128.
  const precioInt = u128.mul(ONE_NEAR, u128.from(precioAuto));
  assert(deposito == precioInt, "El depósito debe ser igual al precio estipulado por el propietario.")
  
  //Transferimos al propietario un monto equivalente al monto ingresado por el usuario al llamar la función.
  ContractPromiseBatch.create(cuentaPropietario).transfer(precioInt);
  
  //Luego, modificamos las propiedades autoDisponible y autoRentado. En ambos casos usamos el set para guardar esa nueva información en la colección.
  if(propietario && propietario.autoDisponible == true) {
    propietario.autoDisponible = false;
    propietarios.set(cuentaPropietario, propietario);
    logging.log("Auto rentado.El usuario ha rentado el auto al propietario.");

  }
  if(cuenta && cuenta.autoRentado == false) {
    cuenta.autoRentado = true;
    usuarios.set(context.sender, cuenta);
  }


}

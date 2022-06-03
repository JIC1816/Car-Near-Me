import { ONE_NEAR } from "../../utils";
import * as contrato from "../assembly";
import { propietarios } from "../assembly/index";
import { usuarios } from "../assembly/index";
import { VMContext } from "near-sdk-as";

const NOMBRE_USUARIO = "Allright";
const NOMBRE_PROPIETARIO = "Juan Carlos";
const NOMBRE_RANDOM = "Random";
const PRECIO = 3;
const USUARIO_ID = "Allright.testnet";
const PROPIETARIO_ID = "Laion.testnet";
const RANDOM_ID = "random.testnet"


// FUNCIONES DE AUXILIO:

const setContext = (): void => {
  //Variables del contexto
  VMContext.setAttached_deposit(ONE_NEAR);
};

const useRandomAsPredecessor = (): void => {
  VMContext.setPredecessor_account_id(RANDOM_ID);
};

const usePropietarioAsPredecessor = (): void => {
  VMContext.setPredecessor_account_id(PROPIETARIO_ID);
};

const useUsuarioAsPredecessor = (): void => {
  VMContext.setPredecessor_account_id(USUARIO_ID);
};

describe("SetPropietario", () => {
  it("Registra un propietario con sus respectivos datos.", () => {

    setContext();
    usePropietarioAsPredecessor();
    contrato.setPropietario(NOMBRE_PROPIETARIO, true, PRECIO);

    const p = propietarios.get(PROPIETARIO_ID);

    if (p) {
      expect(p.cuenta).toBe(PROPIETARIO_ID)
      expect(p.nombre).toBe(NOMBRE_PROPIETARIO)
      expect(p.autoDisponible).toBe(true)
      expect(p.precio).toBe(PRECIO)
    }

  });

  it("Requiere que el precio de renta estipulado sea mayor a 1 NEAR", () => {
    setContext();
    usePropietarioAsPredecessor();

    expect(() => {
      contrato.setPropietario(NOMBRE_PROPIETARIO, true, 0);
    }).toThrow("El precio de renta debe ser mayor a 1 NEAR.");
  })

  it("Requiere que el nombre tenga 3 o más caractéres.", () => {
    setContext();
    usePropietarioAsPredecessor();
    expect(() => {
      contrato.setPropietario("Oz", true, 2);
    }).toThrow("El nombre debe contener 3 o más caractéres.");
  })

  it("Requiere que se haga un depósito de al menos 1 NEAR.", () => {
    usePropietarioAsPredecessor();
    expect(() => {
      contrato.setPropietario(NOMBRE_PROPIETARIO, true, 2);
    }).toThrow("Debes pagar 1 NEAR para registrarte.");
  })
})

describe("SetUsuario", () => {
  it("Registra un usuario con sus respectivos datos.", () => {

    setContext();
    useUsuarioAsPredecessor();
    contrato.setUsuario(NOMBRE_USUARIO, false);

    const u = usuarios.get(USUARIO_ID);

    if (u) {
      expect(u.cuenta).toBe(USUARIO_ID)
      expect(u.nombre).toBe(NOMBRE_USUARIO)
      expect(u.autoRentado).toBe(false)
      
    }

  });

  it("Requiere que el nombre tenga 3 o más caractéres.", () => {
    setContext();
    useUsuarioAsPredecessor();
    expect(() => {
      contrato.setUsuario("Oz", false);
    }).toThrow("El nombre debe contener 3 o más caractéres.");
  })

  it("Requiere que se haga un depósito de al menos 1 NEAR.", () => {
    useUsuarioAsPredecessor();
    expect(() => {
      contrato.setUsuario(NOMBRE_USUARIO, false);
    }).toThrow("Debes pagar 1 NEAR para registrarte.");
  })
})

describe("rentarAuto", () => {
  it("Requiere que quien llama la función sea un usuario registrado", () => {

    setContext();
    useRandomAsPredecessor();
    contrato.setUsuario(NOMBRE_USUARIO, false);

    expect(() => {
      contrato.rentarAuto(PROPIETARIO_ID);
    }).toThrow("Tienes que ser un usuario registrado para ejecutar este comando.");

  });

  it("Requiere que quien llama la función ingrese como parámetro el nombre de un propietario registrado", () => {

    setContext();
    usePropietarioAsPredecessor();
    contrato.setPropietario(NOMBRE_PROPIETARIO, true, PRECIO);


    expect(() => {
      contrato.rentarAuto(RANDOM_ID);
    }).toThrow("Tienes que ingresar la cuenta de un propietario registrado para ejecutar este comando.");

  });

  it("Requiere que el usuario que llama la función realice un depósito igual al precio estipulado por el propietario", () => {

    setContext();
    usePropietarioAsPredecessor();
    contrato.setPropietario(NOMBRE_PROPIETARIO, true, PRECIO);
    
    expect(() => {
      contrato.rentarAuto(PROPIETARIO_ID);
    }).toThrow("El depósito debe ser igual al precio estipulado por el propietario.");

  });
})


// Como podemos rodar isso em um arquivo .ts sem causar erros?
// let employee = {};
// employee.code = 10;
// employee.name = "John";

interface IEmployee {
  code: number;
  name: string;
}

const employee1: IEmployee = {
  code: 10,
  name: "John",
};

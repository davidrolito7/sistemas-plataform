import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BirthdayPerson } from '../interface/birthdays';
import { GenericResponse } from '../interface/birthdays';
import { checkToken } from '../core/auth/interceptor/token.interceptor';

@Injectable({
  providedIn: 'root'
})
export class ApiService {   
    private apiUrl = 'https://oficialiavirtual.tribunaloaxaca.gob.mx/api/Birthday/Empleados';
    private apiUrl2 = 'https://pruebas.tribunaloaxaca.gob.mx/deploy/api/Deploy/upload';

    constructor(private http: HttpClient) {}

    getBirthdays(): Observable<GenericResponse<BirthdayPerson[]>> {
        return this.http.get<GenericResponse<BirthdayPerson[]>>(this.apiUrl);
    }

    uploadDeploy(type: string, project: string, file: File): Observable<GenericResponse<any>> {
        const formData = new FormData();
        formData.append('Type', type);
        formData.append('Project', project);
        formData.append('Zip', file, file.name);
        return this.http.post<GenericResponse<any>>(this.apiUrl2, formData,  { context: checkToken() });
    }


}

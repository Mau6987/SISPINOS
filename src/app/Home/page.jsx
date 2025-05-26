"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from "next/navigation"; 
import Image from 'next/image';

export default function Page() {
    const [profile, setProfile] = useState({ nombre: '', username: '', correo: '', ci: '' });
    const [editMode, setEditMode] = useState(false);
    const [userId, setUserId] = useState(null);  // Agregar un estado para idUser
    const router = useRouter();
    const [token, setToken] = useState(null);  // Estado para token

    useEffect(() => {
        // Solo ejecutamos este código en el cliente (browser)
        const idUser = localStorage.getItem('idUser');
        const userToken = localStorage.getItem('token');
        setUserId(idUser);  // Establecer idUser en el estado
        setToken(userToken);  // Establecer token en el estado
    }, []);

    const apiUrl = userId ? `https://mi-backendsecond.onrender.com/perfil/${userId}` : "";

    useEffect(() => {
        if (userId && token) {
            fetchProfile();
        }
    }, [userId, token]);

    const fetchProfile = async () => {
        try {
            const response = await fetch(apiUrl, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (response.ok) {
                setProfile(data);
            } else {
                router.push('/login');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const handleEdit = () => {
        setEditMode(true);
    };

    const handleCancel = () => {
        setEditMode(false);
        fetchProfile();
    };

    const handleSave = async () => {
        try {
            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(profile),
            });

            if (response.ok) {
                setEditMode(false);
                fetchProfile();
            } else {
                console.error('Failed to save profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-200 py-8">
            <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-4xl border border-gray-300">
                <h1 className="text-3xl font-semibold text-gray-800 mb-6">Bienvenido {profile.nombre}</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col">
                        <label htmlFor="nombre" className="font-medium text-gray-700 mb-1">Nombre:</label>
                        <input
                            id="nombre"
                            type="text"
                            name="nombre"
                            placeholder="Nombre"
                            value={profile.nombre}
                            onChange={handleChange}
                            className="border-2 p-3 rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-800"
                            readOnly={!editMode}
                        />
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="username" className="font-medium text-gray-700 mb-1">Username:</label>
                        <input
                            id="username"
                            type="text"
                            name="username"
                            placeholder="Username"
                            value={profile.username}
                            onChange={handleChange}
                            className="border-2 p-3 rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-800"
                            readOnly={!editMode}
                        />
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="correo" className="font-medium text-gray-700 mb-1">Correo:</label>
                        <input
                            id="correo"
                            type="email"
                            name="correo"
                            placeholder="Correo"
                            value={profile.correo}
                            onChange={handleChange}
                            className="border-2 p-3 rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-800"
                            readOnly={!editMode}
                        />
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="ci" className="font-medium text-gray-700 mb-1">Cédula de Identidad:</label>
                        <input
                            id="ci"
                            type="text"
                            name="ci"
                            placeholder="Cédula de Identidad"
                            value={profile.ci}
                            onChange={handleChange}
                            className="border-2 p-3 rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-800"
                            readOnly={!editMode}
                        />
                    </div>
                </div>

                <div className="flex justify-between items-center mt-6">
                    {editMode ? (
                        <>
                            <button onClick={handleCancel} className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-6 rounded-md">
                                Cancelar
                            </button>
                            <button onClick={handleSave} className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-md">
                                Guardar Cambios
                            </button>
                        </>
                    ) : (
                        <button onClick={handleEdit} className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-md">
                            Editar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

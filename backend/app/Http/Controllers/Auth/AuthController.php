<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
    public function register(RegisterRequest $request)
    {
        $response = DB::transaction(function () use ($request){

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'email_hash' => hash('sha256', strtolower($request->email)),
                'phone' => $request->phone,
                'timezone' => $request->timezone,
                'locale' => $request->locale,
                'password_hash' => Hash::make($request->password),
                ]);
                
                $token = $user->createToken('auth_token')->plainTextToken;
                
                return [
                    'token' => $token,
                    'user' => $user
                ];
        });

        return response()->json([
            'message' => 'Usuário cadastrado com sucesso!' ,
            'data' => [
                'token' => $response['token'],
                'user' => new UserResource($response['user'])
            ]
        ], 201);
    }

    public function login(LoginRequest $request)
    {
        $emailHash = hash('sha256', strtolower($request->email));
        $user = User::where('email_hash', $emailHash)->first();

        if (! $user || ! Hash::check($request->password, $user->password_hash)){
            return response()->json([
                'message' => 'Credenciais inválidas.'
            ], 401);
        }

        if ($user->status !== 'active'){
            return response()->json([
                'message' => 'Acesso negado. Conta banida ou inativa.'
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'data' => [
                'token' => $token,
                'user' => new UserResource($user)
            ]
        ]);
    }

    public function logout()
    {
        request()->user()->currentAccessToken()->delete();

        return response()->json(null, 204);
    }

    public function refresh()
    {
        $user = request()->user();
        $user->currentAccessToken()->delete();
        $newToken = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Token renovado com sucesso.',
            'data' => [
                'token' => $newToken
            ]
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ProfileController extends Controller
{
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'full_name' => 'sometimes|required|string|max:255',
            'phone' => 'sometimes|required|string|max:20',
            'address' => 'sometimes|required|string',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        if ($request->has('full_name')) $user->full_name = $request->full_name;
        if ($request->has('phone')) $user->phone = $request->phone;
        if ($request->has('address')) $user->address = $request->address;

        if ($request->hasFile('photo')) {
            // Delete old photo if exists
            if ($user->photo_path && Storage::disk('public')->exists($user->photo_path)) {
                Storage::disk('public')->delete($user->photo_path);
            }
            $path = $request->file('photo')->store('profiles', 'public');
            $user->photo_path = $path;
        }

        $user->save();

        // Include full asset URL for photo
        $userData = $user->toArray();
        if ($user->photo_path) {
            $userData['photo_url'] = asset('storage/' . $user->photo_path);
        }

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui.',
            'data' => $userData
        ]);
    }

    public function deletePhoto(Request $request)
    {
        $user = $request->user();

        if ($user->photo_path && Storage::disk('public')->exists($user->photo_path)) {
            Storage::disk('public')->delete($user->photo_path);
            $user->photo_path = null;
            $user->save();
        }

        $userData = $user->toArray();
        $userData['photo_url'] = null;

        return response()->json([
            'success' => true,
            'message' => 'Foto profil berhasil dihapus.',
            'data' => $userData
        ]);
    }

    public function updatePassword(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'current_password' => 'required',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['success' => false, 'message' => 'Kata sandi lama tidak sesuai.'], 400);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Kata sandi berhasil diperbarui.'
        ]);
    }

    public function updatePin(Request $request)
    {
        $user = $request->user();

        // If user already has a PIN, require current PIN
        $rules = [
            'new_pin' => 'required|string|digits:6|confirmed',
        ];

        if ($user->security_pin) {
            $rules['current_pin'] = 'required|string|digits:6';
        }

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        if ($user->security_pin && !Hash::check($request->current_pin, $user->security_pin)) {
            return response()->json(['success' => false, 'message' => 'PIN lama tidak sesuai.'], 400);
        }

        $user->security_pin = Hash::make($request->new_pin);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'PIN keamanan berhasil diatur.'
        ]);
    }

    public function verifyPin(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'pin' => 'required|string|digits:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        if (!$user->security_pin) {
            return response()->json(['success' => false, 'message' => 'Anda belum mengatur PIN keamanan.'], 400);
        }

        if (!Hash::check($request->pin, $user->security_pin)) {
            return response()->json(['success' => false, 'message' => 'PIN yang Anda masukkan salah.'], 400);
        }

        return response()->json([
            'success' => true,
            'message' => 'PIN berhasil diverifikasi.'
        ]);
    }
}
